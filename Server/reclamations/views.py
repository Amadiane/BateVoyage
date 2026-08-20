from django.shortcuts import render

# Create your views here.
from django.utils import timezone
from rest_framework import viewsets, permissions
from auditlog.context import set_actor

from utilisateurs.permissions import EstGestionnaireReclamations
from .models import Reclamation
from .serializers import ReclamationSerializer


class ReclamationViewSet(viewsets.ModelViewSet):
    queryset = Reclamation.objects.select_related("pelerin", "assigne_a", "cree_par").all()
    serializer_class = ReclamationSerializer
    permission_classes = [EstGestionnaireReclamations]
    filterset_fields = ["statut", "priorite", "pelerin", "assigne_a"]
    search_fields = ["sujet", "description", "pelerin__nom", "pelerin__prenom", "pelerin__numero_id"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(cree_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            instance = serializer.instance
            nouveau_statut = serializer.validated_data.get("statut", instance.statut)
            # Horodate automatiquement la résolution, une seule fois.
            if nouveau_statut == Reclamation.Statut.RESOLUE and not instance.date_resolution:
                serializer.save(date_resolution=timezone.now())
            else:
                serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()