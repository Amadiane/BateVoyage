from django.db.models import Sum
from django.utils import timezone

from .models import (
    Associe, BonSortie, Decaissement, Dette, DetteFournisseur, SaisonComptable, TauxChange,
)
from .utils import convertir_depuis_gnf, convertir_vers_gnf


def _benefice_reel_gnf(activite, saison_id, taux):
    """Même logique que BeneficeGlobalView : encaissé - décaissé (frais généraux
    + frais personnels), corrigé par créances - dettes fournisseurs."""
    from paiements.models import Paiement

    type_voyage = "pelerinage" if activite == "hajj" else "oumra"

    paiements = Paiement.objects.filter(saison_id=saison_id) if saison_id else Paiement.objects.none()
    if not saison_id or not paiements.exists():
        paiements = Paiement.objects.filter(pelerin__type_voyage=type_voyage)
    total_encaisse = float(paiements.aggregate(t=Sum("montant"))["t"] or 0)

    decaissements = Decaissement.objects.filter(activite=activite)
    if saison_id:
        decaissements = decaissements.filter(saison_id=saison_id)
    total_decaisse = sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in decaissements)

    saison_personnel = SaisonComptable.objects.filter(activite="personnel", est_active=True).first()
    if saison_personnel:
        perso = Decaissement.objects.filter(activite="personnel", saison=saison_personnel)
        total_decaisse += sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in perso)

    total_creance = float(BonSortie.objects.filter(activite=activite, justifie=False).aggregate(t=Sum("montant"))["t"] or 0)
    total_dette = float(DetteFournisseur.objects.filter(activite=activite, soldee=False).aggregate(t=Sum("montant_du"))["t"] or 0)

    return (total_encaisse - total_decaisse) - (total_creance - total_dette)


def calculer_synthese_benefices(activite, saison_id):
    taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 3.75})
    benefice_reel = _benefice_reel_gnf(activite, saison_id, taux)

    colonnes, parts, dettes, differences, nets = [], [], [], [], []
    for a in Associe.objects.all().order_by("ordre"):
        part = benefice_reel * float(a.pourcentage_part) / 100
        if a.est_caisse:
            dette, difference, net = None, None, part
        else:
            dette = sum(
                convertir_vers_gnf(d.montant, d.devise, taux)
                for d in Dette.objects.filter(associe=a, soldee=False)
            )
            difference = dette - part
            net = part - dette

        colonnes.append({
            "id": a.id, "nom": a.nom_complet,
            "pourcentage": float(a.pourcentage_part), "est_caisse": a.est_caisse,
        })
        parts.append(part)
        dettes.append(dette)
        differences.append(difference)
        nets.append(net)

    def cellule(v):
        return None if v is None else convertir_depuis_gnf(v, taux)

    def somme(liste):
        return sum(v for v in liste if v is not None)

    def ligne(cle, designation, valeurs, gras=False):
        return {
            "cle": cle, "designation": designation, "gras": gras,
            "valeurs": [cellule(v) for v in valeurs], "total": cellule(somme(valeurs)),
        }

    saison = SaisonComptable.objects.filter(id=saison_id).first() if saison_id else None

    return {
        "saison_nom": saison.nom if saison else "",
        "taux": {"usd": float(taux.taux_usd), "sar": float(taux.taux_sar)},
        "benefice_reel_global": cellule(benefice_reel),
        "associes": colonnes,
        "lignes": [
            ligne("part", "Part du bénéfice global", parts),
            ligne("dettes", "Total de ses dettes", dettes),
            ligne("difference", "Différence entre dette et bénéfice", differences),
            ligne("net", "Bénéfice net individuel", nets, gras=True),
        ],
    }


def _fmt(valeur, decimales=0):
    texte = f"{valeur:,.{decimales}f}"
    return texte.replace(",", " ").replace(".", ",")


def _fmt_cellule(c):
    if c is None:
        return None
    return {"gnf": _fmt(c["gnf"]), "usd": _fmt(c["usd"], 2), "sar": _fmt(c["sar"], 2)}


def preparer_contexte_pdf(synthese, activite):
    """Met en forme les nombres pour le gabarit PDF (espaces, virgules)."""
    return {
        "titre_activite": "Hajj" if activite == "hajj" else "Oumra",
        "saison_nom": synthese["saison_nom"],
        "date_generation": timezone.now().strftime("%d/%m/%Y"),
        "taux_usd": _fmt(synthese["taux"]["usd"], 2),
        "taux_sar": _fmt(synthese["taux"]["sar"], 2),
        "benefice_reel": _fmt_cellule(synthese["benefice_reel_global"]),
        "colonnes": [
            {"nom": a["nom"], "pourcentage": f"{a['pourcentage']:g}", "est_caisse": a["est_caisse"]}
            for a in synthese["associes"]
        ],
        "signataires": [a["nom"] for a in synthese["associes"] if not a["est_caisse"]],
        "lignes": [
            {
                "designation": l["designation"],
                "gras": l["gras"],
                "cellules": [_fmt_cellule(v) for v in l["valeurs"]],
                "total": _fmt_cellule(l["total"]),
            }
            for l in synthese["lignes"]
        ],
    }