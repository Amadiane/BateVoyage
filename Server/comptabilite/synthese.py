from django.db.models import Count, Sum
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


def pelerins_du_perimetre(type_voyage, saison_id):
    """Pèlerins pris en compte pour une saison.

    - Une saison est choisie : pèlerins inscrits entre sa date de début et sa date de fin.
    - Si aucun pèlerin n'est inscrit dans cette période, on compte tous les pèlerins du module
      (même logique que pour les paiements) et le périmètre l'indique.
    Retourne (pèlerins, périmètre) avec périmètre = "saison", "toutes_par_defaut" ou "toutes".
    """
    from pelerins.models import Pelerin

    pelerins = Pelerin.objects.filter(type_voyage=type_voyage)
    saison = SaisonComptable.objects.filter(id=saison_id).first() if saison_id else None
    if saison is None:
        return pelerins, "toutes"
    dans_la_saison = pelerins.filter(date_inscription__date__range=(saison.date_debut, saison.date_fin))
    if dans_la_saison.exists():
        return dans_la_saison, "saison"
    return pelerins, "toutes_par_defaut"


# ---------- Hajj : agences associées (Tableau 1) ----------
GROUPE_PRINCIPAL_HAJJ = "BATE VOYAGE GUINÉE"

# Chaque groupe regroupe les valeurs du champ "agence_partenaire" des pèlerins Hajj.
# Un pèlerin sans agence partenaire est un pèlerin de BATE VOYAGE GUINÉE.
GROUPES_HAJJ = [
    {"nom": "BATE VOYAGE GUINÉE", "agences": ["", None, "BATE VOYAGE GUINÉE"]},
    {"nom": "INTER-DJIGUI", "agences": ["INTER-DJIGUI"]},
    {"nom": "MANDEN VOYAGE", "agences": ["MANDENG VOYAGE GUINÉE", "MANDEN VOYAGE"]},
]


def repartition_groupes_hajj(benefice_reel, saison_id=None):
    """Répartition des pèlerins Hajj par agence et bénéfice de chaque groupe.

    Règle : bénéfice du groupe = bénéfice réel global x (pèlerins du groupe / pèlerins des trois groupes).
    Les pèlerins comptés sont ceux de la saison (voir pelerins_du_perimetre).
    Retourne (liste de groupes, total des pèlerins des groupes, pèlerins d'autres agences non comptés, périmètre).
    """
    pelerins, perimetre = pelerins_du_perimetre("pelerinage", saison_id)
    compteurs = dict(
        pelerins.order_by().values_list("agence_partenaire").annotate(n=Count("id"))
    )
    groupes = [
        {"nom": g["nom"], "nb_pelerins": sum(compteurs.get(a, 0) for a in g["agences"])}
        for g in GROUPES_HAJJ
    ]
    total = sum(g["nb_pelerins"] for g in groupes)
    hors_groupes = sum(compteurs.values()) - total
    for g in groupes:
        g["pourcentage_pelerins"] = (g["nb_pelerins"] / total * 100) if total else 0.0
        g["benefice_gnf"] = (benefice_reel * g["nb_pelerins"] / total) if total else 0.0
    return groupes, total, hors_groupes, perimetre


def associes_avec_base(activite, benefice_reel, saison_id=None):
    """Associés de l'activité demandée uniquement, avec pourcentage et base de calcul (en GNF).

    - Oumra : le pourcentage de chaque inscripteur suit le nombre de pèlerins qu'il a inscrits
      (ses pèlerins / total des pèlerins attribués) ; la base est le bénéfice réel global.
    - Hajj : pourcentage fixe de l'associé, appliqué au bénéfice de SON groupe d'agence.

    Retourne (liste de dictionnaires, infos) ; infos contient "groupes" (Hajj uniquement),
    "total", "hors_groupes" (pèlerins non attribués) et "perimetre".
    """
    est_oumra = activite == "oumra"
    associes = list(Associe.objects.filter(activite="oumra" if est_oumra else "hajj").order_by("ordre"))

    if est_oumra:
        pelerins, perimetre = pelerins_du_perimetre("oumra", saison_id)
        noms = [a.nom_complet for a in associes]
        compteurs = dict(
            pelerins.filter(inscripteur__in=noms)
            .order_by().values_list("inscripteur").annotate(n=Count("id"))
        )
        total = sum(compteurs.values())
        non_attribues = pelerins.exclude(inscripteur__in=noms).count()
        elements = []
        for a in associes:
            nb = compteurs.get(a.nom_complet, 0)
            elements.append({
                "associe": a,
                "pourcentage": (nb / total * 100) if total else 0.0,
                "nb_pelerins": nb,
                "groupe": "",
                "base": benefice_reel,
            })
        return elements, {"groupes": [], "total": total, "hors_groupes": non_attribues, "perimetre": perimetre}

    groupes, total, hors_groupes, perimetre = repartition_groupes_hajj(benefice_reel, saison_id)
    par_nom = {g["nom"]: g for g in groupes}
    elements = []
    for a in associes:
        nom_groupe = a.groupe_agence or GROUPE_PRINCIPAL_HAJJ
        groupe = par_nom.get(nom_groupe)
        elements.append({
            "associe": a,
            "pourcentage": float(a.pourcentage_part),
            "nb_pelerins": groupe["nb_pelerins"] if groupe else 0,
            "groupe": nom_groupe,
            "base": groupe["benefice_gnf"] if groupe else 0.0,
        })
    return elements, {"groupes": groupes, "total": total, "hors_groupes": hors_groupes, "perimetre": perimetre}


def calculer_synthese_benefices(activite, saison_id):
    taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 3.75})
    benefice_reel = _benefice_reel_gnf(activite, saison_id, taux)

    colonnes, parts, dettes, differences, nets = [], [], [], [], []
    elements, infos_groupes = associes_avec_base(activite, benefice_reel, saison_id)
    for element in elements:
        a = element["associe"]
        pourcentage = element["pourcentage"]
        part = element["base"] * pourcentage / 100
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
            "pourcentage": round(pourcentage, 2), "est_caisse": a.est_caisse,
            "nb_pelerins": element["nb_pelerins"], "groupe": element["groupe"],
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

    # Tableau 1 (Hajj) : répartition des pèlerins et bénéfice par agence
    groupes_sortie, total_groupes, hors_groupes = [], None, 0
    if infos_groupes["groupes"]:
        groupes_sortie = [
            {
                "nom": g["nom"],
                "nb_pelerins": g["nb_pelerins"],
                "pourcentage": round(g["pourcentage_pelerins"], 2),
                "benefice": cellule(g["benefice_gnf"]),
            }
            for g in infos_groupes["groupes"]
        ]
        total_groupes = {
            "nb_pelerins": infos_groupes["total"],
            "benefice": cellule(sum(g["benefice_gnf"] for g in infos_groupes["groupes"])),
        }
        hors_groupes = infos_groupes["hors_groupes"]

    return {
        "saison_nom": saison.nom if saison else "",
        "taux": {"usd": float(taux.taux_usd), "sar": float(taux.taux_sar)},
        "benefice_reel_global": cellule(benefice_reel),
        "associes": colonnes,
        "groupes": groupes_sortie,
        "total_groupes": total_groupes,
        "pelerins_hors_groupes": hors_groupes,
        "perimetre_pelerins": infos_groupes["perimetre"],
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