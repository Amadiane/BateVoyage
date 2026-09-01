from rest_framework import serializers
from .models import Programme, Forfait, LigneForfait

class ProgrammeSerializer(serializers.ModelSerializer):
    nb_pelerins = serializers.SerializerMethodField()

    class Meta:
        model = Programme
        fields = "__all__"

    def get_nb_pelerins(self, obj):
        return obj.pelerins.count()

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