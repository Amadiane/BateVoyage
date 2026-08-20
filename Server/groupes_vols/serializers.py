from rest_framework import serializers
from .models import Vol, Groupe


class VolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vol
        fields = "__all__"


class GroupeSerializer(serializers.ModelSerializer):
    programme_nom = serializers.CharField(source="programme.nom", read_only=True)
    vol_aller_detail = VolSerializer(source="vol_aller", read_only=True)
    vol_retour_detail = VolSerializer(source="vol_retour", read_only=True)
    encadreur_nom = serializers.SerializerMethodField()
    nb_pelerins = serializers.SerializerMethodField()

    class Meta:
        model = Groupe
        fields = "__all__"

    def get_encadreur_nom(self, obj):
        if not obj.encadreur:
            return None
        nom = obj.encadreur.get_full_name()
        return nom if nom.strip() else obj.encadreur.username

    def get_nb_pelerins(self, obj):
        return obj.pelerins.count()