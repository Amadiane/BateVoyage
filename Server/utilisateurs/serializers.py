from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UtilisateurSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email",
                  "telephone", "photo", "role", "role_display", "actif"]
        read_only_fields = ["id"]

class CreationUtilisateurSerializer(serializers.ModelSerializer):
    """Utilisé par l'Admin Général / Fondateur pour créer un compte employé."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email",
                  "telephone", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user