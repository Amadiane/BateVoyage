from django.db import models


class Programme(models.Model):
    class Type(models.TextChoices):
        HAJJ = "hajj", "Hajj"
        OUMRA_RAMADAN = "oumra_ramadan", "Oumra Ramadan"
        OUMRA_CLASSIQUE = "oumra_classique", "Oumra classique"

    nom = models.CharField(max_length=150)
    type_programme = models.CharField(max_length=20, choices=Type.choices)
    annee = models.PositiveIntegerField(help_text="Année de la campagne (ex: 2024)")
    date_depart = models.DateField()
    date_retour = models.DateField()
    date_limite_paiement = models.DateField(
        null=True, blank=True,
        help_text="Date à laquelle le solde doit être intégralement payé"
    )
    prix = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    est_archive = models.BooleanField(
        default=False,
        help_text="Un programme archivé n'apparaît plus dans les alertes de paiement/documents — utile pour les campagnes des années précédentes."
    )

    def __str__(self):
        return f"{self.nom} ({self.get_type_programme_display()} {self.annee})"

    class Meta:
        ordering = ["-annee", "-date_depart"]
        verbose_name = "Programme"
        verbose_name_plural = "Programmes"