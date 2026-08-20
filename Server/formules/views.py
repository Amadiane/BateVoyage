from rest_framework import viewsets, permissions
from auditlog.context import set_actor
from utilisateurs.permissions import EstGestionnaireFinancier
from .models import Programme
from .serializers import ProgrammeSerializer


class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all().order_by("-date_depart")
    serializer_class = ProgrammeSerializer
    permission_classes = [EstGestionnaireFinancier]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()