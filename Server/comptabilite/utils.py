"""Fonctions de conversion de devises partagées par tout le module Comptabilité.

Principe de conversion (tel que défini par l'agence) :
- taux_usd = combien de GNF pour 1 USD (ex: 8600)
- taux_sar = combien de SAR pour 1 USD (ex: 3.75) — PAS combien de GNF pour 1 SAR

La chaîne de conversion est donc : GNF → USD (÷ taux_usd) → SAR (× taux_sar)
"""


def convertir_depuis_gnf(montant_gnf, taux):
    """Convertit un montant en GNF vers ses équivalents USD et SAR."""
    usd = float(montant_gnf) / float(taux.taux_usd) if taux.taux_usd else 0
    sar = usd * float(taux.taux_sar) if taux.taux_sar else 0
    return {
        "gnf": round(float(montant_gnf), 2),
        "usd": round(usd, 2),
        "sar": round(sar, 2),
    }


def convertir_vers_gnf(montant, devise, taux):
    """Convertit un montant dans une devise donnée (GNF/USD/SAR) vers son équivalent GNF."""
    montant = float(montant)
    if devise == "GNF":
        return montant
    if devise == "USD":
        return montant * float(taux.taux_usd)
    if devise == "SAR":
        # SAR -> USD -> GNF
        montant_usd = montant / float(taux.taux_sar) if taux.taux_sar else 0
        return montant_usd * float(taux.taux_usd)
    return montant