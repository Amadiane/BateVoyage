from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from auditlog.models import LogEntry
from .serializers import EntreeJournalSerializer


class JournalGlobalView(generics.ListAPIView):
    """Journal central — les 200 dernières actions sur tout le système,
    grandes lignes uniquement (pas de détail champ par champ ici)."""
    serializer_class = EntreeJournalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LogEntry.objects.select_related("actor", "content_type").order_by("-timestamp")[:200]