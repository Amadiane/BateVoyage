from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UtilisateurSerializer, CreationUtilisateurSerializer
from .permissions import EstFondateurOuAdmin

User = get_user_model()

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)

class UtilisateurViewSet(viewsets.ModelViewSet):
    """Gestion des comptes employés — réservé Fondateur/Admin Général."""
    queryset = User.objects.all().order_by("role", "last_name")
    permission_classes = [EstFondateurOuAdmin]
    filterset_fields = ["role", "actif"]
    search_fields = ["first_name", "last_name", "username", "email"]

    def get_serializer_class(self):
        if self.action == "create":
            return CreationUtilisateurSerializer
        return UtilisateurSerializer