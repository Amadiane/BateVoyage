from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Reclamation


@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display = ["sujet", "pelerin", "statut", "priorite", "assigne_a", "date_creation"]
    list_filter = ["statut", "priorite"]
    search_fields = ["sujet", "pelerin__nom", "pelerin__prenom"]