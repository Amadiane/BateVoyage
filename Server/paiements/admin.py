from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ["pelerin", "montant", "mode_paiement", "date_paiement", "enregistre_par"]
    list_filter = ["mode_paiement"]
    search_fields = ["pelerin__nom", "pelerin__prenom", "pelerin__numero_id", "reference"]


from .models import Paiement, SequenceRecu

@admin.register(SequenceRecu)
class SequenceRecuAdmin(admin.ModelAdmin):
    list_display = ["annee", "dernier_numero"]