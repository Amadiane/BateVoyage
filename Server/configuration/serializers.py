from rest_framework import serializers
from .models import ModuleSysteme


class ModuleSystemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleSysteme
        fields = "__all__"