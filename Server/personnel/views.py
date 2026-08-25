from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from auditlog.context import set_actor
from .models import FichePersonnel
from .serializers import FichePersonnelSerializer


class FichePersonnelViewSet(viewsets.ModelViewSet):
    queryset = FichePersonnel.objects.select_related("utilisateur").all()
    serializer_class = FichePersonnelSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["disponibilite", "utilisateur__role"]
    search_fields = ["utilisateur__first_name", "utilisateur__last_name", "matricule"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()