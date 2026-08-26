from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from utilisateurs.permissions import EstFondateurOuAdmin
from .models import ModuleSysteme
from .serializers import ModuleSystemeSerializer


class ModuleSystemeViewSet(viewsets.ModelViewSet):
    queryset = ModuleSysteme.objects.all()
    serializer_class = ModuleSystemeSerializer

    def get_permissions(self):
        # Lecture ouverte à tout utilisateur connecté (pour construire le menu),
        # écriture réservée au Fondateur/Admin.
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [EstFondateurOuAdmin()]