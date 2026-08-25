from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from utilisateurs.permissions import EstFondateurOuAdmin
from .models import ModeleDocument
from .serializers import ModeleDocumentSerializer


class ModeleDocumentViewSet(viewsets.ModelViewSet):
    queryset = ModeleDocument.objects.all()
    serializer_class = ModeleDocumentSerializer
    permission_classes = [EstFondateurOuAdmin]
    lookup_field = "type_document"