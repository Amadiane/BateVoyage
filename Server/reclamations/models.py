from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from pelerins.models import Pelerin


class Reclamation(models.Model):
    class Statut(models.TextChoices):
        NOUVELLE = "nouvelle", "Nouvelle"
        EN_COURS = "en_cours", "En cours de traitement"
        RESOLUE = "resolue", "Résolue"
        FERMEE = "fermee", "Fermée"

    class Priorite(models.TextChoices):
        BASSE = "basse", "Basse"
        NORMALE = "normale", "Normale"
        HAUTE = "haute", "Haute"
        URGENTE = "urgente", "Urgente"

    pelerin = models.ForeignKey(Pelerin, on_delete=models.CASCADE, related_name="reclamations")
    sujet = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(max_length=15, choices=Statut.choices, default=Statut.NOUVELLE)
    priorite = models.CharField(max_length=10, choices=Priorite.choices, default=Priorite.NORMALE)

    assigne_a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reclamations_assignees",
        limit_choices_to={"role__in": ["fondateur", "admin_general", "affaires_sociales"]},
    )
    reponse = models.TextField(blank=True)

    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reclamations_creees"
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_resolution = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Réclamation"
        verbose_name_plural = "Réclamations"

    def __str__(self):
        return f"{self.sujet} — {self.pelerin.numero_id}"