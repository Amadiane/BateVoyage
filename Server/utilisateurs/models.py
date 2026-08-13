from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        FONDATEUR = "fondateur", "Fondateur"
        ADMIN_GENERAL = "admin_general", "Administrateur Général"
        COMPTABLE = "comptable", "Comptable"
        SECRETAIRE = "secretaire", "Secrétaire"
        DOCTEUR = "docteur", "Docteur"
        TRADUCTEUR = "traducteur", "Traducteur"
        AFFAIRES_SOCIALES = "affaires_sociales", "Affaires sociales"
        GUIDE = "guide", "Guide"
        ENCADREUR = "encadreur", "Encadreur"
        MOUNAZIM = "mounazim", "Mounazim"
        PELERIN = "pelerin", "Pèlerin"

    role = models.CharField(max_length=25, choices=Role.choices, default=Role.PELERIN)
    telephone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to="utilisateurs/photos/", blank=True, null=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"