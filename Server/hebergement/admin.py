from django.contrib import admin
from .models import Hotel, Chambre


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ["nom", "ville", "date_debut_sejour", "date_fin_sejour"]
    list_filter = ["ville"]


@admin.register(Chambre)
class ChambreAdmin(admin.ModelAdmin):
    list_display = ["hotel", "numero", "type_chambre", "capacite"]
    list_filter = ["hotel", "type_chambre"]