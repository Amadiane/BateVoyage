from django.db import models


class Programme(models.Model):
    class Type(models.TextChoices):
        HAJJ = "hajj", "Hajj"
        OUMRA_RAMADAN = "oumra_ramadan", "Oumra Ramadan"
        OUMRA_CLASSIQUE = "oumra_classique", "Oumra classique"

    nom = models.CharField(max_length=150)
    type_programme = models.CharField(max_length=20, choices=Type.choices)
    date_depart = models.DateField()
    date_retour = models.DateField()
    capacite_max = models.IntegerField()
    prix_double = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prix_triple = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    prix_quadruple = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_programme_display()})"

    class Meta:
        verbose_name = "Programme"
        verbose_name_plural = "Programmes"