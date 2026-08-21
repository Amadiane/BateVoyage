from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from utilisateurs.permissions import EstGestionnaireFinancier
from .models import Programme
from .serializers import ProgrammeSerializer


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