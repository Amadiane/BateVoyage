from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class Vol(models.Model):
    compagnie = models.CharField(max_length=100)
    numero_vol = models.CharField(max_length=20)
    date_vol = models.DateField()
    heure_vol = models.TimeField()
    aeroport_depart = models.CharField(max_length=100)
    aeroport_arrivee = models.CharField(max_length=100)

    class Meta:
        ordering = ["date_vol", "heure_vol"]
        verbose_name = "Vol"
        verbose_name_plural = "Vols"

    def __str__(self):
        return f"{self.compagnie} {self.numero_vol} — {self.date_vol} ({self.aeroport_depart} → {self.aeroport_arrivee})"


class Groupe(models.Model):
    nom = models.CharField(max_length=150)
    programme = models.ForeignKey(
        "formules.Programme", on_delete=models.SET_NULL, null=True, blank=True, related_name="groupes"
    )
    vol_aller = models.ForeignKey(
        Vol, on_delete=models.SET_NULL, null=True, blank=True, related_name="groupes_aller"
    )
    vol_retour = models.ForeignKey(
        Vol, on_delete=models.SET_NULL, null=True, blank=True, related_name="groupes_retour"
    )
    encadreur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="groupes_encadres",
        limit_choices_to={"role__in": ["guide", "encadreur", "mounazim"]},
    )
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Groupe"
        verbose_name_plural = "Groupes"

    def __str__(self):
        return self.nom