from django.apps import AppConfig


class HebergementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "hebergement"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Hotel, Chambre
        auditlog.register(Hotel)
        auditlog.register(Chambre)