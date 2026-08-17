from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from auditlog.context import set_actor
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import ConnexionSerializer

from .serializers import UtilisateurSerializer, CreationUtilisateurSerializer, ModifierMotDePasseSerializer
from .permissions import EstFondateurOuAdmin

User = get_user_model()

class ConnexionView(TokenObtainPairView):
    serializer_class = ConnexionSerializer

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)


class AgentsInscripteursView(generics.ListAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(
            role__in=["fondateur", "admin_general", "secretaire", "comptable", "affaires_sociales"],
            actif=True,
        ).order_by("first_name")


class UtilisateurViewSet(viewsets.ModelViewSet):
    """Gestion des comptes employés — réservé Fondateur/Admin Général."""
    queryset = User.objects.all().order_by("role", "last_name")
    permission_classes = [EstFondateurOuAdmin]
    filterset_fields = ["role", "actif"]
    search_fields = ["first_name", "last_name", "username", "email"]

    def get_serializer_class(self):
        if self.action == "create":
            return CreationUtilisateurSerializer
        return UtilisateurSerializer

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["post"], url_path="mot-de-passe")
    def modifier_mot_de_passe(self, request, pk=None):
        """Permet au Fondateur/Admin Général de réinitialiser le mot de
        passe d'un employé, sans passer par l'admin Django."""
        utilisateur = self.get_object()
        serializer = ModifierMotDePasseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur.set_password(serializer.validated_data["nouveau_mot_de_passe"])
        utilisateur.save()
        return Response({"detail": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        from django.contrib.contenttypes.models import ContentType
        from auditlog.models import LogEntry
        from activite.serializers import EntreeJournalDetailSerializer

        utilisateur = self.get_object()
        content_type = ContentType.objects.get_for_model(User)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(utilisateur.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)