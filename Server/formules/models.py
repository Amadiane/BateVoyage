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


class Forfait(models.Model):
    class TypeVoyage(models.TextChoices):
        HAJJ = "pelerinage", "Hajj"
        OUMRA = "oumra", "Oumra"

    class Standard(models.TextChoices):
        VIP = "vip", "VIP"
        SEMI_VIP = "semi_vip", "Semi-VIP"
        STANDARD = "standard", "Standard"

    nom = models.CharField(max_length=150)
    type_voyage = models.CharField(max_length=20, choices=TypeVoyage.choices)
    standard = models.CharField(max_length=20, choices=Standard.choices)
    annee = models.PositiveIntegerField()
    prix_vente = models.PositiveBigIntegerField(help_text="En francs guinéens (GNF), chiffre uniquement")
    cout_reel = models.PositiveBigIntegerField(help_text="En francs guinéens (GNF), chiffre uniquement")
    nombre_places = models.PositiveIntegerField()
    services_inclus = models.TextField(blank=True, help_text="Un service par ligne")
    services_exclus = models.TextField(blank=True, help_text="Un service par ligne")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-annee", "type_voyage", "standard"]
        verbose_name = "Forfait"
        verbose_name_plural = "Forfaits"

    @property
    def marge(self):
        return self.prix_vente - self.cout_reel

    def __str__(self):
        return f"{self.nom} ({self.get_standard_display()} {self.annee})"


class LigneForfait(models.Model):
    forfait = models.ForeignKey(Forfait, on_delete=models.CASCADE, related_name="lignes")
    libelle = models.CharField(max_length=150)
    montant = models.PositiveBigIntegerField(default=0, help_text="En GNF, chiffre uniquement")
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordre", "id"]
        verbose_name = "Ligne de prestation"
        verbose_name_plural = "Lignes de prestations"

    def __str__(self):
        return f"{self.libelle} — {self.montant} GNF"