from rest_framework import serializers
from .models import Vol, Groupe, Vehicule
from pelerins.models import Pelerin


class VolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vol
        type_vol_display = serializers.CharField(source="get_type_vol_display", read_only=True)
        fields = "__all__"


class GroupeSerializer(serializers.ModelSerializer):
    programme_nom = serializers.CharField(source="programme.nom", read_only=True)
    vol_aller_detail = VolSerializer(source="vol_aller", read_only=True)
    vol_retour_detail = VolSerializer(source="vol_retour", read_only=True)
    
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

class VolSerializer(serializers.ModelSerializer):
    nb_pelerins_affectes = serializers.SerializerMethodField()

    class Meta:
        model = Vol
        fields = "__all__"

    def get_nb_pelerins_affectes(self, obj):
        return Pelerin.objects.filter(groupe__vol_aller=obj).count() + Pelerin.objects.filter(groupe__vol_retour=obj).count()

class VehiculeSerializer(serializers.ModelSerializer):
    type_vehicule_display = serializers.CharField(source="get_type_vehicule_display", read_only=True)
    occupants_actuels = serializers.IntegerField(read_only=True)
    places_restantes = serializers.SerializerMethodField()

    class Meta:
        model = Vehicule
        fields = "__all__"

    def get_places_restantes(self, obj):
        return obj.places_restantes