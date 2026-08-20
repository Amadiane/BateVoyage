from rest_framework import serializers
from .models import Pelerin


class PelerinSerializer(serializers.ModelSerializer):
    inscripteur_nom = serializers.SerializerMethodField()
    sexe_display = serializers.CharField(source="get_sexe_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    statut_visa_display = serializers.CharField(source="get_statut_visa_display", read_only=True)
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    mode_paiement_display = serializers.CharField(source="get_mode_paiement_display", read_only=True)
    montant_total_verse = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    telephone_urgence = serializers.CharField(read_only=True)
    dossier_complet = serializers.BooleanField(read_only=True)
    reste_a_payer = serializers.SerializerMethodField()
    prix_programme = serializers.SerializerMethodField()
    statut_paiement = serializers.CharField(read_only=True)
    jours_avant_echeance_paiement = serializers.IntegerField(read_only=True)
    groupe_nom = serializers.CharField(source="groupe.nom", read_only=True)

    class Meta:
        model = Pelerin
        fields = "__all__"
        read_only_fields = ["numero_id", "date_inscription"]

    def get_inscripteur_nom(self, obj):
        if not obj.inscripteur:
            return None
        nom_complet = obj.inscripteur.get_full_name()
        return nom_complet if nom_complet.strip() else obj.inscripteur.username

    def get_prix_programme(self, obj):
        if obj.programme and obj.programme.prix:
            return obj.programme.prix
        return None

    def get_reste_a_payer(self, obj):
        prix = self.get_prix_programme(obj)
        if prix is None:
            return None
        return float(prix) - float(obj.montant_total_verse)