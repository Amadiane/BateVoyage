from django.apps import AppConfig


class PelerinsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pelerins"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Pelerin
        auditlog.register(Pelerin)