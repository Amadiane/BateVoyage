from django.shortcuts import render

# Create your views here.
# views.py
from rest_framework import viewsets, permissions
from .models import Pelerin
from .serializers import PelerinSerializer

class PelerinViewSet(viewsets.ModelViewSet):
    queryset = Pelerin.objects.all().order_by("-date_inscription")
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["statut", "statut_visa", "programme"]
    search_fields = ["nom", "prenom", "numero_dossier", "numero_passeport"]