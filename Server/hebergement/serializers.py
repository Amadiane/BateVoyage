from rest_framework import serializers
from .models import Hotel, Chambre


class ChambreSerializer(serializers.ModelSerializer):
    occupants_actuels = serializers.IntegerField(read_only=True)
    places_restantes = serializers.IntegerField(read_only=True)
    hotel_nom = serializers.CharField(source="hotel.nom", read_only=True)

    class Meta:
        model = Chambre
        fields = "__all__"


class HotelSerializer(serializers.ModelSerializer):
    nb_chambres = serializers.SerializerMethodField()
    capacite_totale = serializers.SerializerMethodField()
    occupants_totaux = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = "__all__"

    def get_nb_chambres(self, obj):
        return obj.chambres.count()

    def get_capacite_totale(self, obj):
        return sum(c.capacite for c in obj.chambres.all())

    def get_occupants_totaux(self, obj):
        return sum(c.occupants_actuels for c in obj.chambres.all())