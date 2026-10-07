from django.db import transaction
from rest_framework import serializers
from .models import (
    Programme, Forfait, LigneForfait,
    SejourProgramme, TransportProgramme, ActivitePlanning,
)


class SejourProgrammeSerializer(serializers.ModelSerializer):
    ville_display = serializers.CharField(source="get_ville_display", read_only=True)
    nombre_nuits = serializers.IntegerField(read_only=True)

    class Meta:
        model = SejourProgramme
        exclude = ["programme"]


class TransportProgrammeSerializer(serializers.ModelSerializer):
    type_trajet_display = serializers.CharField(source="get_type_trajet_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = TransportProgramme
        exclude = ["programme"]


class ActivitePlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivitePlanning
        exclude = ["programme"]


RELATIONS_PROGRAMME = {
    "sejours": SejourProgramme,
    "transports": TransportProgramme,
    "planning": ActivitePlanning,
}


class ProgrammeSerializer(serializers.ModelSerializer):
    nb_pelerins = serializers.SerializerMethodField()
    duree_jours = serializers.IntegerField(read_only=True)
    duree_nuits = serializers.IntegerField(read_only=True)
    type_programme_display = serializers.CharField(source="get_type_programme_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    sejours = SejourProgrammeSerializer(many=True, required=False)
    transports = TransportProgrammeSerializer(many=True, required=False)
    planning = ActivitePlanningSerializer(many=True, required=False)

    class Meta:
        model = Programme
        fields = "__all__"

    def get_nb_pelerins(self, obj):
        return obj.pelerins.count()

    def validate(self, attrs):
        depart = attrs.get("date_depart", getattr(self.instance, "date_depart", None))
        retour = attrs.get("date_retour", getattr(self.instance, "date_retour", None))
        if depart and retour and retour < depart:
            raise serializers.ValidationError({"date_retour": "La date de retour doit être après la date de départ."})
        return attrs

    def _remplacer_relations(self, programme, donnees):
        for cle, modele in RELATIONS_PROGRAMME.items():
            lignes = donnees.get(cle)
            if lignes is None:
                continue
            getattr(programme, cle).all().delete()
            for ligne in lignes:
                modele.objects.create(programme=programme, **ligne)

    @transaction.atomic
    def create(self, validated_data):
        donnees = {cle: validated_data.pop(cle, None) for cle in RELATIONS_PROGRAMME}
        programme = Programme.objects.create(**validated_data)
        self._remplacer_relations(programme, donnees)
        return programme

    @transaction.atomic
    def update(self, instance, validated_data):
        donnees = {cle: validated_data.pop(cle, None) for cle in RELATIONS_PROGRAMME}
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        self._remplacer_relations(instance, donnees)
        return instance


class LigneForfaitSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneForfait
        fields = ["id", "libelle", "montant", "ordre"]
        extra_kwargs = {"montant": {"required": False}}


class ForfaitSerializer(serializers.ModelSerializer):
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    standard_display = serializers.CharField(source="get_standard_display", read_only=True)
    marge = serializers.IntegerField(read_only=True)
    lignes = LigneForfaitSerializer(many=True, required=False)
    total_lignes = serializers.SerializerMethodField()

    class Meta:
        model = Forfait
        fields = "__all__"

    def get_total_lignes(self, obj):
        return sum(l.montant for l in obj.lignes.all())

    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        forfait = Forfait.objects.create(**validated_data)
        for i, ligne in enumerate(lignes_data):
            LigneForfait.objects.create(forfait=forfait, ordre=i, **ligne)
        return forfait

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop("lignes", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if lignes_data is not None:
            instance.lignes.all().delete()
            for i, ligne in enumerate(lignes_data):
                LigneForfait.objects.create(forfait=instance, ordre=i, **ligne)
        return instance