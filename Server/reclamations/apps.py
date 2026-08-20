from django.apps import AppConfig


class ReclamationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "reclamations"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Reclamation
        auditlog.register(Reclamation)