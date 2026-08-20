from django.db import models

# Create your models here.
from django.db import models


class Hotel(models.Model):
    class Ville(models.TextChoices):
        MECQUE = "mecque", "Mecque"
        MEDINE = "medine", "Médine"

    nom = models.CharField(max_length=150)
    ville = models.CharField(max_length=10, choices=Ville.choices)
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    date_debut_sejour = models.DateField(null=True, blank=True)
    date_fin_sejour = models.DateField(null=True, blank=True)
    cout_contrat = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["ville", "nom"]
        verbose_name = "Hôtel"
        verbose_name_plural = "Hôtels"

    def __str__(self):
        return f"{self.nom} ({self.get_ville_display()})"


class Chambre(models.Model):
    class TypeChambre(models.TextChoices):
        INDIVIDUELLE = "individuelle", "Individuelle"
        DOUBLE = "double", "Double"
        TRIPLE = "triple", "Triple"
        QUADRUPLE = "quadruple", "Quadruple"

    CAPACITES = {
        "individuelle": 1, "double": 2, "triple": 3, "quadruple": 4,
    }

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="chambres")
    numero = models.CharField(max_length=20)
    type_chambre = models.CharField(max_length=15, choices=TypeChambre.choices)
    capacite = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["numero"]
        verbose_name = "Chambre"
        verbose_name_plural = "Chambres"
        unique_together = ["hotel", "numero"]

    def save(self, *args, **kwargs):
        if not self.capacite or self.capacite == 1:
            self.capacite = self.CAPACITES.get(self.type_chambre, 1)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.hotel.nom} — Ch. {self.numero}"

    @property
    def occupants_actuels(self):
        return self.pelerins.count()

    @property
    def places_restantes(self):
        return self.capacite - self.occupants_actuels