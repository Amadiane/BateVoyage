from django.apps import AppConfig


class PersonnelConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "personnel"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import FichePersonnel
        auditlog.register(FichePersonnel)