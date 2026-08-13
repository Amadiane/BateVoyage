# serializers.py
from rest_framework import serializers
from .models import Pelerin

class PelerinSerializer(serializers.ModelSerializer):
    dossier_complet = serializers.BooleanField(read_only=True)

    class Meta:
        model = Pelerin
        fields = "__all__"
        read_only_fields = ["numero_dossier", "date_inscription"]