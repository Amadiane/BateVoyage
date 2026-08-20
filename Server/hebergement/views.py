from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor

from utilisateurs.permissions import EstGestionnaireLogistique
from .models import Hotel, Chambre
from .serializers import HotelSerializer, ChambreSerializer


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
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


class ChambreViewSet(viewsets.ModelViewSet):
    queryset = Chambre.objects.select_related("hotel").all()
    serializer_class = ChambreSerializer
    permission_classes = [EstGestionnaireLogistique]
    filterset_fields = ["hotel"]

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
        chambre = self.get_object()
        ids = request.data.get("pelerin_ids", [])

        places_dispo = chambre.places_restantes
        if len(ids) > places_dispo:
            return Response(
                {"erreur": f"Capacité insuffisante : {places_dispo} place(s) restante(s), {len(ids)} sélectionné(s)."},
                status=400,
            )

        with set_actor(request.user):
            Pelerin.objects.filter(id__in=ids).update(chambre=chambre)
        return Response({"detail": f"{len(ids)} pèlerin(s) affecté(s) à la chambre."})

    @action(detail=True, methods=["post"], url_path="retirer-pelerin")
    def retirer_pelerin(self, request, pk=None):
        from pelerins.models import Pelerin
        pelerin_id = request.data.get("pelerin_id")
        with set_actor(request.user):
            Pelerin.objects.filter(id=pelerin_id, chambre_id=pk).update(chambre=None)
        return Response({"detail": "Pèlerin retiré de la chambre."})