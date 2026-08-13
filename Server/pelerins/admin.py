from django.contrib import admin
from .models import Pelerin, SequenceInscription


@admin.register(Pelerin)
class PelerinAdmin(admin.ModelAdmin):
    list_display = ["numero_id", "nom", "prenom", "sexe", "statut", "statut_visa", "inscripteur", "dossier_complet"]
    list_filter = ["statut", "statut_visa", "sexe", "programme"]
    search_fields = ["nom", "prenom", "numero_id", "numero_passeport", "telephone"]


@admin.register(SequenceInscription)
class SequenceInscriptionAdmin(admin.ModelAdmin):
    list_display = ["annee", "dernier_numero"]