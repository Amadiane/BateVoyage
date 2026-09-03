from django.http import HttpResponse
from django.template.loader import render_to_string
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from auditlog.models import LogEntry
from xhtml2pdf import pisa

from pelerins.models import Pelerin
from pelerins.pdf_utils import link_callback
from activite.serializers import EntreeJournalDetailSerializer
from utilisateurs.permissions import EstGestionnaireLogistique
from .models import Vol, Groupe
from .serializers import VolSerializer, GroupeSerializer


class VolViewSet(viewsets.ModelViewSet):
    queryset = Vol.objects.all()
    serializer_class = VolSerializer
    permission_classes = [EstGestionnaireLogistique]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"], url_path="manifeste-pdf")
    def manifeste_pdf(self, request, pk=None):
        vol = self.get_object()
        pelerins_aller = Pelerin.objects.filter(groupe__vol_aller=vol)
        pelerins_retour = Pelerin.objects.filter(groupe__vol_retour=vol)

        html = render_to_string("groupes_vols/manifeste_vol.html", {
            "v": vol, "pelerins_aller": pelerins_aller, "pelerins_retour": pelerins_retour,
        })

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="manifeste_vol_{vol.numero_vol}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response


class GroupeViewSet(viewsets.ModelViewSet):
    queryset = Groupe.objects.select_related("programme", "vol_aller", "vol_retour", "encadreur").all()
    serializer_class = GroupeSerializer
    permission_classes = [EstGestionnaireLogistique]
    filterset_fields = ["vol_aller", "vol_retour", "programme"]
    filterset_fields = ["type_vol"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"], url_path="manifeste-pdf")
    def manifeste_pdf(self, request, pk=None):
        groupe = self.get_object()
        pelerins = groupe.pelerins.all().order_by("nom")
        html = render_to_string("groupes_vols/manifeste.html", {"g": groupe, "pelerins": pelerins})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="manifeste_{groupe.nom}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["post"], url_path="affecter-pelerins")
    def affecter_pelerins(self, request, pk=None):
        groupe = self.get_object()
        ids = request.data.get("pelerin_ids", [])
        with set_actor(request.user):
            Pelerin.objects.filter(id__in=ids).update(groupe=groupe)
        return Response({"detail": f"{len(ids)} pèlerin(s) affecté(s) au groupe."})

    @action(detail=True, methods=["post"], url_path="retirer-pelerin")
    def retirer_pelerin(self, request, pk=None):
        pelerin_id = request.data.get("pelerin_id")
        with set_actor(request.user):
            Pelerin.objects.filter(id=pelerin_id, groupe_id=pk).update(groupe=None)
        return Response({"detail": "Pèlerin retiré du groupe."})