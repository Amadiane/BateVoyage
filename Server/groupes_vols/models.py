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
    numero_billet_reference = models.CharField(max_length=100, blank=True, help_text="Référence de réservation groupe (PNR)")
    bagages_autorises_kg = models.PositiveIntegerField(null=True, blank=True, help_text="Poids autorisé par pèlerin, en kg")

    class TypeVol(models.TextChoices):
        ALLER = "aller", "Aller"
        RETOUR = "retour", "Retour"

    type_vol = models.CharField(max_length=10, choices=TypeVol.choices, default=TypeVol.ALLER)

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
    encadreur = models.CharField(max_length=150, blank=True, help_text="Nom du guide/encadreur (saisie libre)")
    responsable_medical = models.CharField(max_length=150, blank=True, help_text="Nom du médecin/responsable médical (saisie libre)")
    capacite_max = models.PositiveIntegerField(null=True, blank=True, help_text="Nombre maximum de pèlerins pour ce groupe")
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Groupe"
        verbose_name_plural = "Groupes"

    def __str__(self):
        return self.nom


class Vehicule(models.Model):
    class TypeVehicule(models.TextChoices):
        BUS = "bus", "Bus"
        MINIBUS = "minibus", "Minibus"
        VOITURE = "voiture", "Voiture"
        AUTRE = "autre", "Autre"

    numero_bus = models.CharField(max_length=20, unique=True, help_text="Numéro ou nom du bus (ex: Bus 01)")
    type_vehicule = models.CharField(max_length=15, choices=TypeVehicule.choices, default=TypeVehicule.BUS)
    plaque_immatriculation = models.CharField(max_length=30, blank=True)
    capacite = models.PositiveIntegerField(null=True, blank=True)
    chauffeur = models.CharField(max_length=150, blank=True, help_text="Nom du chauffeur (saisie libre)")
    telephone_chauffeur = models.CharField(max_length=20, blank=True)
    trajet = models.CharField(max_length=255, blank=True, help_text="Ex: Hôtel Makkah → Haram")
    date_debut_utilisation = models.DateField(null=True, blank=True)
    date_fin_utilisation = models.DateField(null=True, blank=True)
    cout_location = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    groupe_lie = models.ForeignKey(
        "Groupe", on_delete=models.SET_NULL, null=True, blank=True, related_name="vehicules_lies"
    )
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["numero_bus"]
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"

    def __str__(self):
        return f"{self.numero_bus} ({self.get_type_vehicule_display()})"

    @property
    def occupants_actuels(self):
        return self.pelerins.count()

    @property
    def places_restantes(self):
        if not self.capacite:
            return None
        return self.capacite - self.occupants_actuels