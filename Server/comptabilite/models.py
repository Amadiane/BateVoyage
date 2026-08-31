from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings

class Activite(models.TextChoices):
    HAJJ = "hajj", "Hajj"
    OUMRA = "oumra", "Oumra"
    GENERAL = "general", "Général (agence)"

class BonSortie(models.Model):
    numero_bon = models.CharField(max_length=20, unique=True, editable=False, blank=True)
    beneficiaire_nom = models.CharField(max_length=150, help_text="Nom de la personne qui reçoit l'argent")
    beneficiaire_utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="bons_sortie_recus",
        help_text="Si c'est un employé du système, le sélectionner ici (optionnel)"
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    activite = models.CharField(max_length=20, choices=Activite.choices, default=Activite.GENERAL)
    motif = models.CharField(max_length=255)
    date_sortie = models.DateField()
    justifie = models.BooleanField(default=False, help_text="Coché une fois l'argent justifié ou remboursé")
    date_justification = models.DateField(null=True, blank=True)
    notes_justification = models.TextField(blank=True)
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="bons_sortie_enregistres"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_sortie"]
        verbose_name = "Bon de sortie"
        verbose_name_plural = "Bons de sortie"

    def save(self, *args, **kwargs):
        if not self.numero_bon:
            from django.utils import timezone
            annee = str(timezone.now().year)[-2:]
            dernier = BonSortie.objects.filter(numero_bon__endswith=f"-{annee}").count()
            self.numero_bon = f"BS-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero_bon} — {self.beneficiaire_nom} ({self.montant} GNF)"


class Depense(models.Model):
    class Categorie(models.TextChoices):
        LOYER = "loyer", "Loyer"
        SALAIRES = "salaires", "Salaires"
        FOURNITURES = "fournitures", "Fournitures"
        TRANSPORT = "transport", "Transport"
        COMMUNICATION = "communication", "Communication"
        AUTRE = "autre", "Autre"

    categorie = models.CharField(max_length=20, choices=Categorie.choices)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    activite = models.CharField(max_length=20, choices=Activite.choices, default=Activite.GENERAL)
    description = models.CharField(max_length=255)
    date_depense = models.DateField()
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="depenses_enregistrees"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_depense"]
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"

    def __str__(self):
        return f"{self.get_categorie_display()} — {self.montant} GNF ({self.date_depense})"


class DetteFournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length=150, help_text="Ex: Makkah Towers, Air Guinée")
    montant_du = models.DecimalField(max_digits=12, decimal_places=2)
    activite = models.CharField(max_length=20, choices=Activite.choices, default=Activite.GENERAL)
    motif = models.CharField(max_length=255)
    date_echeance = models.DateField(null=True, blank=True)
    soldee = models.BooleanField(default=False)
    date_paiement = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="dettes_fournisseur_enregistrees"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Dette fournisseur"
        verbose_name_plural = "Dettes fournisseurs"

    def __str__(self):
        return f"{self.nom_fournisseur} — {self.montant_du} GNF"

