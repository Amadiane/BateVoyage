from rest_framework import serializers
from .models import Pelerin


class PelerinSerializer(serializers.ModelSerializer):
    inscripteur_nom = serializers.CharField(source="inscripteur.get_full_name", read_only=True)
    sexe_display = serializers.CharField(source="get_sexe_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    statut_visa_display = serializers.CharField(source="get_statut_visa_display", read_only=True)
    telephone_urgence = serializers.CharField(read_only=True)
    dossier_complet = serializers.BooleanField(read_only=True)

    class Meta:
        model = Pelerin
        fields = "__all__"
        read_only_fields = ["numero_id", "date_inscription"]