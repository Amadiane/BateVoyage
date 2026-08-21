from django.shortcuts import render

# Create your views here.
from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from pelerins.models import Pelerin

SEUIL_EXPIRATION_JOURS = 180  # alerte si passeport expire dans moins de 6 mois


class TableauBordDocumentsView(APIView):
    """Vue agrégée : dossiers incomplets, passeports proches de l'expiration,
    visas en attente — construite à partir des données déjà présentes sur
    Pelerin, sans nouveau modèle."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        aujourdhui = date.today()
        seuil = aujourdhui + timedelta(days=SEUIL_EXPIRATION_JOURS)

        pelerins = Pelerin.objects.exclude(statut=Pelerin.Statut.CLOTURE).exclude(programme__est_archive=True).select_related("inscripteur")

        dossiers_incomplets = []
        passeports_expirant = []
        visas_en_attente = []

        for p in pelerins:
            manquants = []
            if not p.numero_passeport:
                manquants.append("numero_passeport")
            if not p.scan_passeport:
                manquants.append("scan_passeport")
            if p.statut_visa != Pelerin.StatutVisa.OBTENU:
                manquants.append("visa")
            if not p.scan_certificat_medical:
                manquants.append("scan_certificat_medical")
            if not p.photo:
                manquants.append("photo")

            if manquants:
                dossiers_incomplets.append({
                    "id": p.id,
                    "numero_id": p.numero_id,
                    "nom_complet": f"{p.prenom} {p.nom}",
                    "champs_manquants": manquants,
                })

            if p.date_expiration_passeport and p.date_expiration_passeport <= seuil:
                passeports_expirant.append({
                    "id": p.id,
                    "numero_id": p.numero_id,
                    "nom_complet": f"{p.prenom} {p.nom}",
                    "date_expiration_passeport": p.date_expiration_passeport,
                    "deja_expire": p.date_expiration_passeport < aujourdhui,
                })

            if p.statut_visa in [Pelerin.StatutVisa.NON_DEMANDE, Pelerin.StatutVisa.EN_COURS]:
                visas_en_attente.append({
                    "id": p.id,
                    "numero_id": p.numero_id,
                    "nom_complet": f"{p.prenom} {p.nom}",
                    "statut_visa": p.statut_visa,
                })

        passeports_expirant.sort(key=lambda x: x["date_expiration_passeport"])

        return Response({
            "total_pelerins": pelerins.count(),
            "total_dossiers_incomplets": len(dossiers_incomplets),
            "dossiers_incomplets": dossiers_incomplets,
            "passeports_expirant": passeports_expirant,
            "visas_en_attente": visas_en_attente,
        })