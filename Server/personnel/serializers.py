from rest_framework import serializers
from .models import FichePersonnel


class FichePersonnelSerializer(serializers.ModelSerializer):
    matricule = serializers.CharField(read_only=True)
    disponibilite_display = serializers.CharField(source="get_disponibilite_display", read_only=True)
    zone_competence_display = serializers.CharField(source="get_zone_competence_display", read_only=True)
    zone_affectation_display = serializers.CharField(source="get_zone_affectation_display", read_only=True)

    utilisateur_nom = serializers.SerializerMethodField()
    utilisateur_role = serializers.CharField(source="utilisateur.role", read_only=True)
    utilisateur_role_display = serializers.CharField(source="utilisateur.get_role_display", read_only=True)
    utilisateur_telephone = serializers.CharField(source="utilisateur.telephone", read_only=True)
    utilisateur_photo = serializers.ImageField(source="utilisateur.photo", read_only=True)

    class Meta:
        model = FichePersonnel
        fields = "__all__"

    def get_utilisateur_nom(self, obj):
        nom = obj.utilisateur.get_full_name()
        return nom if nom.strip() else obj.utilisateur.username