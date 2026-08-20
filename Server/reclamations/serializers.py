from rest_framework import serializers
from .models import Reclamation


class ReclamationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    priorite_display = serializers.CharField(source="get_priorite_display", read_only=True)
    pelerin_nom = serializers.SerializerMethodField()
    pelerin_numero_id = serializers.CharField(source="pelerin.numero_id", read_only=True)
    assigne_a_nom = serializers.SerializerMethodField()
    cree_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Reclamation
        fields = "__all__"
        read_only_fields = ["cree_par", "date_creation", "date_resolution"]

    def get_pelerin_nom(self, obj):
        return f"{obj.pelerin.prenom} {obj.pelerin.nom}"

    def get_assigne_a_nom(self, obj):
        if not obj.assigne_a:
            return None
        nom = obj.assigne_a.get_full_name()
        return nom if nom.strip() else obj.assigne_a.username

    def get_cree_par_nom(self, obj):
        nom = obj.cree_par.get_full_name()
        return nom if nom.strip() else obj.cree_par.username