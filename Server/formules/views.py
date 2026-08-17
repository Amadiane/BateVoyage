from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Programme
from .serializers import ProgrammeSerializer
from auditlog.context import set_actor

class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all().order_by("-date_depart")
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()