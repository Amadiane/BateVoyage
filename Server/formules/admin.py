from django.contrib import admin
from .models import Programme, Forfait, LigneForfait


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ["nom", "type_programme", "date_depart", "date_retour", "prix"]
    list_filter = ["type_programme"]


@admin.register(Forfait)
class ForfaitAdmin(admin.ModelAdmin):
    list_display = ["nom", "standard", "annee", "prix_vente", "nombre_places"]
    list_filter = ["standard", "annee"]


@admin.register(LigneForfait)
class LigneForfaitAdmin(admin.ModelAdmin):
    list_display = ["forfait", "libelle", "montant", "ordre"]