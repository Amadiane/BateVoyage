from django.apps import AppConfig


class DocumentsGeneresConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "documents_generes"

    def ready(self):
        from auditlog.registry import auditlog
        from .models import ModeleDocument
        auditlog.register(ModeleDocument)