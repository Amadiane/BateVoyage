"""Totaux « créances » et « dettes » du bénéfice global.

Source unique, utilisée par BeneficeGlobalView, BeneficeIndividuelView et
synthese._benefice_reel_gnf afin que le bénéfice réel soit identique partout.

Créances = bons de sortie non justifiés  + créances non soldées (page « Créance »)
Dettes   = dettes fournisseurs non soldées + dettes non soldées (page « Dette »)

Les dettes rattachées à un associé NE sont PAS retirées du bénéfice global :
elles sont déjà déduites de la part de cet associé dans « Bénéfices individuels »
(sinon elles seraient déduites deux fois). Mettre INCLURE_DETTES_ASSOCIES = True
pour les compter aussi dans le global.
"""
from django.db.models import Sum

from .models import BonSortie, Creance, Dette, DetteFournisseur
from .utils import convertir_vers_gnf

INCLURE_DETTES_ASSOCIES = False


def totaux_creances_dettes(activite, taux):
    """Retourne (total_creance, total_dette, details) en GNF.

    details = {"creance": [...], "dette": [...], "dettes_associes": gnf ou None}
    """
    bons = float(
        BonSortie.objects.filter(activite=activite, justifie=False).aggregate(t=Sum("montant"))["t"] or 0
    )
    creances = sum(
        convertir_vers_gnf(c.montant, c.devise, taux)
        for c in Creance.objects.filter(activite=activite, soldee=False)
    )

    dettes_fournisseurs = float(
        DetteFournisseur.objects.filter(activite=activite, soldee=False).aggregate(t=Sum("montant_du"))["t"] or 0
    )
    dettes_qs = Dette.objects.filter(activite=activite, soldee=False)
    dettes_associes = None
    if not INCLURE_DETTES_ASSOCIES:
        # Information seulement : ces dettes sont déduites dans Bénéfices individuels.
        dettes_associes = sum(
            convertir_vers_gnf(d.montant, d.devise, taux) for d in dettes_qs.filter(associe__isnull=False)
        )
        dettes_qs = dettes_qs.filter(associe__isnull=True)
    dettes = sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in dettes_qs)

    details = {
        "creance": [("Bons de sortie non justifiés", bons), ("Créances (page Créance)", creances)],
        "dette": [("Dettes fournisseurs non soldées", dettes_fournisseurs), ("Dettes (page Dette)", dettes)],
        # None si ces dettes sont déjà comprises dans le total (INCLURE_DETTES_ASSOCIES = True)
        "dettes_associes": dettes_associes,
    }
    return bons + creances, dettes_fournisseurs + dettes, details