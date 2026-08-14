from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Programme
from .serializers import ProgrammeSerializer

class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all().order_by("-date_depart")
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]