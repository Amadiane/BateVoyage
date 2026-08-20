from django.apps import AppConfig


class GroupesVolsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "groupes_vols"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Vol, Groupe
        auditlog.register(Vol)
        auditlog.register(Groupe)