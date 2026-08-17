import requests
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa

from .models import Pelerin
from .serializers import PelerinSerializer



from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa
import requests

from .models import Pelerin
from .serializers import PelerinSerializer
from .pdf_utils import link_callback  

from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from activite.serializers import EntreeJournalDetailSerializer
from auditlog.context import set_actor

CHAMPS_DOCUMENTS = ["photo", "scan_passeport", "scan_certificat_medical", "scan_recu_versement"]


class PelerinViewSet(viewsets.ModelViewSet):
    queryset = Pelerin.objects.select_related("inscripteur", "programme").all()
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["statut", "statut_visa", "sexe", "type_voyage", "inscripteur", "programme"]
    search_fields = ["nom", "prenom", "numero_id", "numero_passeport", "telephone"]

    from .pdf_utils import link_callback

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"], url_path="fiche-pdf")
    def fiche_pdf(self, request, pk=None):
        pelerin = self.get_object()
        html = render_to_string("pelerins/fiche_inscription.html", {"p": pelerin})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="fiche_{pelerin.numero_id}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["get"], url_path="document/(?P<champ>[^/.]+)")
    def document(self, request, pk=None, champ=None):
        if champ not in CHAMPS_DOCUMENTS:
            raise Http404("Champ de document invalide.")

        pelerin = self.get_object()
        fichier = getattr(pelerin, champ, None)
        if not fichier:
            raise Http404("Aucun document pour ce champ.")

        reponse_cloudinary = requests.get(fichier.url)

        if reponse_cloudinary.status_code != 200:
            return Response(
                {"erreur": f"Cloudinary a renvoyé le statut {reponse_cloudinary.status_code} pour ce fichier."},
                status=502,
            )

        content_type = reponse_cloudinary.headers.get("Content-Type", "")
        contenu = reponse_cloudinary.content

        if "text/html" in content_type or len(contenu) < 200:
            return Response(
                {"erreur": "Le fichier renvoyé par Cloudinary semble invalide ou vide."},
                status=502,
            )

        # Nom réel du fichier stocké, avec sa vraie extension — ne jamais
        # forcer une extension arbitraire côté frontend.
        nom_fichier = fichier.name.split("/")[-1]

        response = HttpResponse(contenu, content_type=content_type or "application/octet-stream")
        response["Content-Disposition"] = f'inline; filename="{nom_fichier}"'
        response["X-Nom-Fichier-Reel"] = nom_fichier
        return response
    
    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        pelerin = self.get_object()
        content_type = ContentType.objects.get_for_model(Pelerin)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(pelerin.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)