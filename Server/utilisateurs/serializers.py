from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

User = get_user_model()

class UtilisateurSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email",
                  "telephone", "photo", "role", "role_display", "actif", "date_joined"]
        read_only_fields = ["id", "date_joined"]


class CreationUtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

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


class ModifierMotDePasseSerializer(serializers.Serializer):
    nouveau_mot_de_passe = serializers.CharField(min_length=6, write_only=True)





class ConnexionSerializer(TokenObtainPairSerializer):
    """Empêche la connexion des comptes désactivés (actif=False) —
    simplejwt ne vérifie que le mot de passe par défaut, pas ce champ
    personnalisé."""

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.actif:
            raise AuthenticationFailed(
                "Ce compte a été désactivé. Contactez votre administrateur.",
                code="compte_inactif",
            )

        return data