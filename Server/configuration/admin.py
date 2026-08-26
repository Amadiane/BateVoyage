from django.contrib import admin
from .models import ModuleSysteme


@admin.register(ModuleSysteme)
class ModuleSystemeAdmin(admin.ModelAdmin):
    list_display = ["nom_affiche", "cle", "actif", "ordre"]
    list_editable = ["actif", "ordre"]