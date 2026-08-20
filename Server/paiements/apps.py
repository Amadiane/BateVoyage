from django.apps import AppConfig


class PaiementsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "paiements"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Paiement
        auditlog.register(Paiement)