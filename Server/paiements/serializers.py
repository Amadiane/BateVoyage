from rest_framework import serializers
from .models import Paiement


class PaiementSerializer(serializers.ModelSerializer):
    mode_paiement_display = serializers.CharField(source="get_mode_paiement_display", read_only=True)
    pelerin_nom = serializers.SerializerMethodField()
    pelerin_numero_id = serializers.CharField(source="pelerin.numero_id", read_only=True)
    enregistre_par_nom = serializers.SerializerMethodField()
    numero_recu = serializers.CharField(read_only=True)

    class Meta:
        model = Paiement
        fields = "__all__"
        read_only_fields = ["enregistre_par", "date_creation"]

    def get_pelerin_nom(self, obj):
        return f"{obj.pelerin.prenom} {obj.pelerin.nom}"

    def get_enregistre_par_nom(self, obj):
        nom = obj.enregistre_par.get_full_name()
        return nom if nom.strip() else obj.enregistre_par.username