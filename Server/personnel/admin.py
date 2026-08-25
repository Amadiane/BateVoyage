from django.contrib import admin
from .models import FichePersonnel


@admin.register(FichePersonnel)
class FichePersonnelAdmin(admin.ModelAdmin):
    list_display = ["matricule", "utilisateur", "disponibilite", "nombre_saisons_experience"]
    list_filter = ["disponibilite"]