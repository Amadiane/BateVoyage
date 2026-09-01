from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from utilisateurs.permissions import EstGestionnaireFinancier
from .models import Programme
from .serializers import ProgrammeSerializer
from .models import Programme, Forfait
from .serializers import ProgrammeSerializer, ForfaitSerializer

from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from xhtml2pdf import pisa
from pelerins.pdf_utils import link_callback
from utilisateurs.permissions import EstGestionnaireFinancier
from .models import Programme, Forfait
from .serializers import ProgrammeSerializer, ForfaitSerializer


class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all().order_by("-annee", "-date_depart")
    serializer_class = ProgrammeSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["type_programme", "annee", "est_archive"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["post"], url_path="affecter-pelerins")
    def affecter_pelerins(self, request, pk=None):
        from pelerins.models import Pelerin
        programme = self.get_object()
        ids = request.data.get("pelerin_ids", [])
        with set_actor(request.user):
            Pelerin.objects.filter(id__in=ids).update(programme=programme)
        return Response({"detail": f"{len(ids)} pèlerin(s) affecté(s) à cette activité."})

    @action(detail=True, methods=["post"], url_path="retirer-pelerin")
    def retirer_pelerin(self, request, pk=None):
        from pelerins.models import Pelerin
        pelerin_id = request.data.get("pelerin_id")
        with set_actor(request.user):
            Pelerin.objects.filter(id=pelerin_id, programme_id=pk).update(programme=None)
        return Response({"detail": "Pèlerin retiré de cette activité."})



from django.template.loader import render_to_string
from xhtml2pdf import pisa
from pelerins.pdf_utils import link_callback


class ForfaitViewSet(viewsets.ModelViewSet):
    queryset = Forfait.objects.all()
    serializer_class = ForfaitSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["type_voyage", "standard", "annee"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        forfait = self.get_object()
        total_lignes = sum(l.montant for l in forfait.lignes.all())
        html = render_to_string("formules/fiche_forfait.html", {"f": forfait, "total_lignes": total_lignes})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="devis_{forfait.nom}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response