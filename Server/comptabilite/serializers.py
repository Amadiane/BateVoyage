from rest_framework import serializers
from .models import BonSortie, Depense, DetteFournisseur, CategorieDecaissement, Decaissement, TauxChange, SaisonComptable


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



class CategorieDecaissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieDecaissement
        fields = "__all__"


class DecaissementSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source="categorie.nom", read_only=True)
    pelerin_nom = serializers.SerializerMethodField()
    enregistre_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Decaissement
        fields = "__all__"
        read_only_fields = ["enregistre_par", "date_creation"]

    def get_pelerin_nom(self, obj):
        if obj.pelerin:
            return f"{obj.pelerin.prenom} {obj.pelerin.nom}"
        return None

    def get_enregistre_par_nom(self, obj):
        nom = obj.enregistre_par.get_full_name()
        return nom if nom.strip() else obj.enregistre_par.username

class TauxChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TauxChange
        fields = "__all__"

class SaisonComptableSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaisonComptable
        fields = "__all__"