from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa

from .models import Pelerin
from .serializers import PelerinSerializer


class PelerinViewSet(viewsets.ModelViewSet):
    """CRUD complet : list, retrieve, create, update, partial_update, destroy."""
    queryset = Pelerin.objects.select_related("inscripteur", "programme").all()
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["statut", "statut_visa", "sexe", "inscripteur", "programme"]
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