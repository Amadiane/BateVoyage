from django.contrib import admin
from .models import Programme


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ["nom", "type_programme", "date_depart", "date_retour", "prix"]
    list_filter = ["type_programme"]