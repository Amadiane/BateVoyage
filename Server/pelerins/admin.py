from django.contrib import admin

# Register your models here.
# admin.py
from django.contrib import admin
from .models import Pelerin

@admin.register(Pelerin)
class PelerinAdmin(admin.ModelAdmin):
    list_display = ["numero_dossier", "nom", "prenom", "statut", "statut_visa", "dossier_complet", "programme"]
    list_filter = ["statut", "statut_visa", "programme"]
    search_fields = ["nom", "prenom", "numero_dossier", "numero_passeport"]