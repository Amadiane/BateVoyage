from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import BonSortie, Depense, DetteFournisseur


@admin.register(BonSortie)
class BonSortieAdmin(admin.ModelAdmin):
    list_display = ["numero_bon", "beneficiaire_nom", "montant", "date_sortie", "justifie"]
    list_filter = ["justifie"]


@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display = ["categorie", "montant", "date_depense", "description"]
    list_filter = ["categorie"]


@admin.register(DetteFournisseur)
class DetteFournisseurAdmin(admin.ModelAdmin):
    list_display = ["nom_fournisseur", "montant_du", "date_echeance", "soldee"]
    list_filter = ["soldee"]