from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from xhtml2pdf import pisa

from pelerins.pdf_utils import link_callback
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


class GroupeViewSet(viewsets.ModelViewSet):
    queryset = Groupe.objects.select_related("programme", "vol_aller", "vol_retour", "encadreur").all()
    serializer_class = GroupeSerializer
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
        from pelerins.models import Pelerin
        groupe = self.get_object()
        ids = request.data.get("pelerin_ids", [])
        with set_actor(request.user):
            Pelerin.objects.filter(id__in=ids).update(groupe=groupe)
        return Response({"detail": f"{len(ids)} pèlerin(s) affecté(s) au groupe."})

    @action(detail=True, methods=["post"], url_path="retirer-pelerin")
    def retirer_pelerin(self, request, pk=None):
        from pelerins.models import Pelerin
        pelerin_id = request.data.get("pelerin_id")
        with set_actor(request.user):
            Pelerin.objects.filter(id=pelerin_id, groupe_id=pk).update(groupe=None)
        return Response({"detail": "Pèlerin retiré du groupe."})