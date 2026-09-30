from rest_framework import serializers
from .models import Vol, Groupe, Vehicule
from pelerins.models import Pelerin


class VolSerializer(serializers.ModelSerializer):
    type_vol_display = serializers.CharField(source="get_type_vol_display", read_only=True)
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    nb_pelerins_affectes = serializers.SerializerMethodField()

    class Meta:
        model = Vol
        fields = "__all__"

    def get_nb_pelerins_affectes(self, obj):
        return Pelerin.objects.filter(groupe__vol_aller=obj).count() + Pelerin.objects.filter(groupe__vol_retour=obj).count()


class GroupeSerializer(serializers.ModelSerializer):
    programme_nom = serializers.CharField(source="programme.nom", read_only=True)
    vol_aller_detail = VolSerializer(source="vol_aller", read_only=True)
    vol_retour_detail = VolSerializer(source="vol_retour", read_only=True)
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    nb_pelerins = serializers.SerializerMethodField()

    class Meta:
        model = Groupe
        fields = "__all__"

    def get_nb_pelerins(self, obj):
        return obj.pelerins.count()


class VehiculeSerializer(serializers.ModelSerializer):
    type_vehicule_display = serializers.CharField(source="get_type_vehicule_display", read_only=True)
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    occupants_actuels = serializers.IntegerField(read_only=True)
    places_restantes = serializers.SerializerMethodField()
    groupe_lie_nom = serializers.CharField(source="groupe_lie.nom", read_only=True, default=None)

    class Meta:
        model = Vehicule
        fields = "__all__"

    def get_places_restantes(self, obj):
        return obj.places_restantes