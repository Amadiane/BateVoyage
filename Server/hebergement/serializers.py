from rest_framework import serializers
from .models import Hotel, Chambre, Ville, Campement


class VilleSerializer(serializers.ModelSerializer):
    nb_hotels = serializers.SerializerMethodField()
    nb_campements = serializers.SerializerMethodField()

    class Meta:
        model = Ville
        fields = "__all__"

    def get_nb_hotels(self, obj):
        return obj.hotels.count()

    def get_nb_campements(self, obj):
        return obj.campements.count()


class ChambreSerializer(serializers.ModelSerializer):
    occupants_actuels = serializers.IntegerField(read_only=True)
    places_restantes = serializers.IntegerField(read_only=True)
    erreurs_affectation = serializers.ListField(read_only=True)
    hotel_nom = serializers.CharField(source="hotel.nom", read_only=True)

    class Meta:
        model = Chambre
        fields = "__all__"


class HotelSerializer(serializers.ModelSerializer):
    ville_nom = serializers.CharField(source="ville.nom", read_only=True)
    categorie_display = serializers.CharField(source="get_categorie_display", read_only=True)
    nb_chambres = serializers.SerializerMethodField()
    capacite_totale = serializers.SerializerMethodField()
    occupants_totaux = serializers.SerializerMethodField()
    nb_erreurs = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = "__all__"

    def get_nb_chambres(self, obj):
        return obj.chambres.count()

    def get_capacite_totale(self, obj):
        return sum(c.capacite for c in obj.chambres.all())

    def get_occupants_totaux(self, obj):
        return sum(c.occupants_actuels for c in obj.chambres.all())

    def get_nb_erreurs(self, obj):
        return sum(1 for c in obj.chambres.all() if c.erreurs_affectation)


class CampementSerializer(serializers.ModelSerializer):
    ville_nom = serializers.CharField(source="ville.nom", read_only=True)

    class Meta:
        model = Campement
        fields = "__all__"