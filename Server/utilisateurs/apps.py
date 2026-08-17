from django.apps import AppConfig


class UtilisateursConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "utilisateurs"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Utilisateur
        # On exclut le mot de passe et la dernière connexion — jamais
        # de données sensibles dans un journal d'audit consultable.
        auditlog.register(Utilisateur, exclude_fields=["password", "last_login"])