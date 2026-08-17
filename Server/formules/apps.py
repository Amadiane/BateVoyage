from django.apps import AppConfig


class FormulesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "formules"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import Programme
        auditlog.register(Programme)