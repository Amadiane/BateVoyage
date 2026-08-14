import requests
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa

from .models import Pelerin
from .serializers import PelerinSerializer

CHAMPS_DOCUMENTS = ["photo", "scan_passeport", "scan_certificat_medical", "scan_recu_versement"]


class PelerinViewSet(viewsets.ModelViewSet):
    queryset = Pelerin.objects.select_related("inscripteur", "programme").all()
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["statut", "statut_visa", "sexe", "type_voyage", "inscripteur", "programme"]
    search_fields = ["nom", "prenom", "numero_id", "numero_passeport", "telephone"]

    @action(detail=True, methods=["get"], url_path="fiche-pdf")
    def fiche_pdf(self, request, pk=None):
        """Génère la fiche d'inscription du pèlerin en PDF téléchargeable."""
        pelerin = self.get_object()
        html = render_to_string("pelerins/fiche_inscription.html", {"p": pelerin})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="fiche_{pelerin.numero_id}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["get"], url_path="document/(?P<champ>[^/.]+)")
    def document(self, request, pk=None, champ=None):
        """Proxy sécurisé vers un document Cloudinary — masque l'URL réelle
        et impose l'authentification, contrairement à un lien Cloudinary direct."""
        if champ not in CHAMPS_DOCUMENTS:
            raise Http404("Champ de document invalide.")

        pelerin = self.get_object()
        fichier = getattr(pelerin, champ, None)
        if not fichier:
            raise Http404("Aucun document pour ce champ.")

        reponse_cloudinary = requests.get(fichier.url, stream=True)
        if reponse_cloudinary.status_code != 200:
            return Response({"erreur": "Document introuvable sur le stockage."}, status=404)

        content_type = reponse_cloudinary.headers.get("Content-Type", "application/octet-stream")
        nom_fichier = fichier.name.split("/")[-1]

        response = HttpResponse(reponse_cloudinary.content, content_type=content_type)
        response["Content-Disposition"] = f'inline; filename="{nom_fichier}"'
        return response