from rest_framework import serializers
from .models import Programme


class ProgrammeSerializer(serializers.ModelSerializer):
    nb_pelerins = serializers.SerializerMethodField()

    class Meta:
        model = Programme
        fields = "__all__"

    def get_nb_pelerins(self, obj):
        return obj.pelerins.count()