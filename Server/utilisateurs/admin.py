from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ["username", "get_full_name", "role", "telephone", "actif", "is_staff"]
    list_filter = ["role", "actif"]
    fieldsets = UserAdmin.fieldsets + (
        ("Informations BateVoyage", {"fields": ("role", "telephone", "photo", "actif")}),
    )