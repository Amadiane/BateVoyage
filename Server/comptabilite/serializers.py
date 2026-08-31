from rest_framework import serializers
from .models import BonSortie, Depense, DetteFournisseur


class BonSortieSerializer(serializers.ModelSerializer):
    numero_bon = serializers.CharField(read_only=True)
    enregistre_par_nom = serializers.SerializerMethodField()
    activite_display = serializers.CharField(source="get_activite_display", read_only=True)

    class Meta:
        model = BonSortie
        fields = "__all__"
        read_only_fields = ["enregistre_par", "date_creation"]

    def get_enregistre_par_nom(self, obj):
        nom = obj.enregistre_par.get_full_name()
        return nom if nom.strip() else obj.enregistre_par.username


class DepenseSerializer(serializers.ModelSerializer):
    categorie_display = serializers.CharField(source="get_categorie_display", read_only=True)
    enregistre_par_nom = serializers.SerializerMethodField()
    activite_display = serializers.CharField(source="get_activite_display", read_only=True)

    class Meta:
        model = Depense
        fields = "__all__"
        read_only_fields = ["enregistre_par", "date_creation"]

    def get_enregistre_par_nom(self, obj):
        nom = obj.enregistre_par.get_full_name()
        return nom if nom.strip() else obj.enregistre_par.username


class DetteFournisseurSerializer(serializers.ModelSerializer):
    enregistre_par_nom = serializers.SerializerMethodField()
    activite_display = serializers.CharField(source="get_activite_display", read_only=True)

    class Meta:
        model = DetteFournisseur
        fields = "__all__"
        read_only_fields = ["enregistre_par", "date_creation"]

    def get_enregistre_par_nom(self, obj):
        nom = obj.enregistre_par.get_full_name()
        return nom if nom.strip() else obj.enregistre_par.username