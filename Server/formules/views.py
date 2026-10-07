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
    filterset_fields = ["type_programme", "annee", "est_archive", "statut"]

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("sejours", "transports", "planning")
        # ?famille=oumra → tous les types Oumra (classique, Ramadan, spéciale)
        if self.request.query_params.get("famille") == "oumra":
            qs = qs.filter(type_programme__startswith="oumra")
        return qs

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

    @action(detail=True, methods=["get"], url_path="planning-pdf")
    def planning_pdf(self, request, pk=None):
        programme = self.get_object()
        if not programme.planning_valide:
            return Response({"erreur": "Le planning doit être validé avant l'export."}, status=400)

        html = render_to_string(
            "formules/planning_programme.html",
            {"p": programme, "planning": programme.planning.all(), "sejours": programme.sejours.all()},
        )
        response = HttpResponse(content_type="application/pdf")
        nom_fichier = programme.reference or f"programme_{programme.pk}"
        response["Content-Disposition"] = f'attachment; filename="planning_{nom_fichier}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response


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