from django.apps import AppConfig


class ConfigurationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "configuration"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import ModuleSysteme
        auditlog.register(ModuleSysteme)