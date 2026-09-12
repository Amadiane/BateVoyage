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



from django.db import models


class Devise(models.TextChoices):
    GNF = "GNF", "Franc Guinéen"
    USD = "USD", "Dollar US"
    SAR = "SAR", "Riyal Saoudien"


class CategorieDecaissement(models.Model):
    """Catégories fixes de frais généraux, différentes pour Hajj et Oumra,
    éditables par l'agence (le client veut pouvoir en ajouter via 'Autres charges')."""

    class Activite(models.TextChoices):
        HAJJ = "hajj", "Hajj"
        OUMRA = "oumra", "Oumra"
        PERSONNEL = "personnel", "Frais personnels (agence)"

    activite = models.CharField(max_length=15, choices=Activite.choices)
    nom = models.CharField(max_length=150)
    ordre = models.PositiveIntegerField(default=0)
    est_categorie_fixe = models.BooleanField(default=True, help_text="False pour les catégories ajoutées librement par l'agence")

    class Meta:
        ordering = ["activite", "ordre"]
        unique_together = ["activite", "nom"]
        verbose_name = "Catégorie de décaissement"
        verbose_name_plural = "Catégories de décaissement"

    def __str__(self):
        return f"{self.nom} ({self.get_activite_display()})"


class SaisonComptable(models.Model):
    nom = models.CharField(max_length=100, unique=True, help_text="Ex: Hajj 2027")
    activite = models.CharField(max_length=15, choices=CategorieDecaissement.Activite.choices)
    date_debut = models.DateField(help_text="Début réel de l'exercice, peut être en fin d'année précédente")
    date_fin = models.DateField()
    est_active = models.BooleanField(default=True, help_text="La saison actuellement en cours d'utilisation")

    class Meta:
        ordering = ["-date_debut"]
        verbose_name = "Saison comptable"

    def __str__(self):
        return self.nom


class Decaissement(models.Model):
    activite = models.CharField(max_length=15, choices=CategorieDecaissement.Activite.choices)
    categorie = models.ForeignKey(CategorieDecaissement, on_delete=models.PROTECT, related_name="decaissements")
    libelle_complementaire = models.CharField(max_length=255, blank=True, help_text="Précision, ex: période concernée")
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.GNF)
    pelerin = models.ForeignKey(
        "pelerins.Pelerin", on_delete=models.SET_NULL, null=True, blank=True, related_name="decaissements_lies",
        help_text="Si cette dépense concerne un pèlerin précis (pour Bénéfices par pèlerin)"
    )
    date_decaissement = models.DateField()
    saison = models.ForeignKey(SaisonComptable, on_delete=models.PROTECT, related_name="decaissements", null=True, blank=True)
    enregistre_par = models.ForeignKey("utilisateurs.Utilisateur", on_delete=models.PROTECT, related_name="decaissements_enregistres")
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_decaissement"]
        verbose_name = "Décaissement"
        verbose_name_plural = "Décaissements"

    def __str__(self):
        return f"{self.categorie.nom} — {self.montant} {self.devise}"


class Dette(models.Model):
    """Ce que l'agence doit à quelqu'un (personne physique, différent de
    DetteFournisseur qui existait déjà pour les fournisseurs)."""

    class ModePaiement(models.TextChoices):
        ESPECES = "especes", "Espèces"
        ORANGE_MONEY = "orange_money", "Orange Money"
        VIREMENT = "virement", "Virement bancaire"

    date = models.DateField()
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.GNF)
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    mode_paiement = models.CharField(max_length=20, choices=ModePaiement.choices, blank=True)
    soldee = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    enregistre_par = models.ForeignKey("utilisateurs.Utilisateur", on_delete=models.PROTECT, related_name="dettes_enregistrees")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Dette"

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.montant} {self.devise}"


class Creance(models.Model):
    """Ce que quelqu'un doit à l'agence — mêmes colonnes que Dette, sens inverse."""

    class ModePaiement(models.TextChoices):
        ESPECES = "especes", "Espèces"
        ORANGE_MONEY = "orange_money", "Orange Money"
        VIREMENT = "virement", "Virement bancaire"

    date = models.DateField()
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.GNF)
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    mode_paiement = models.CharField(max_length=20, choices=ModePaiement.choices, blank=True)
    soldee = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    enregistre_par = models.ForeignKey("utilisateurs.Utilisateur", on_delete=models.PROTECT, related_name="creances_enregistrees")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Créance"

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.montant} {self.devise}"


class Associe(models.Model):
    """Les 3 associés + la caisse, pour la répartition des bénéfices individuels."""
    nom_complet = models.CharField(max_length=150)
    pourcentage_part = models.DecimalField(max_digits=5, decimal_places=2, help_text="Ex: 30.00 pour 30%")
    est_caisse = models.BooleanField(default=False, help_text="Coché uniquement pour 'La caisse'")
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordre"]
        verbose_name = "Associé"

    def __str__(self):
        return f"{self.nom_complet} ({self.pourcentage_part}%)"


class DevisFacture(models.Model):
    class TypeDocument(models.TextChoices):
        DEVIS = "devis", "Devis"
        FACTURE = "facture", "Facture"
        AVOIR = "avoir", "Avoir"

    type_document = models.CharField(max_length=10, choices=TypeDocument.choices)
    numero = models.CharField(max_length=30, unique=True, editable=False, blank=True)
    pelerin = models.ForeignKey("pelerins.Pelerin", on_delete=models.SET_NULL, null=True, blank=True, related_name="devis_factures")
    client_nom = models.CharField(max_length=150, blank=True, help_text="Si pas lié à un pèlerin")
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.GNF)
    date_emission = models.DateField()
    paye = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    enregistre_par = models.ForeignKey("utilisateurs.Utilisateur", on_delete=models.PROTECT, related_name="devis_factures_enregistres")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_emission"]
        verbose_name = "Devis / Facture"

    def save(self, *args, **kwargs):
        if not self.numero:
            from django.utils import timezone
            prefixe = {"devis": "DEV", "facture": "FAC", "avoir": "AVO"}[self.type_document]
            annee = str(timezone.now().year)[-2:]
            dernier = DevisFacture.objects.filter(numero__startswith=f"{prefixe}-").count()
            self.numero = f"{prefixe}-{dernier + 1:04d}-{annee}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero




from django.db import migrations

CATEGORIES_HAJJ = [
    "Charges communes", "Charges particulières IBAN", "Charges particulières CONSULAT",
    "Transports Mounazim", "Prime Mounazim", "Frais du scan des passeports pour le visa",
    "Frais docteur", "Frais des médicaments des pèlerins", "Cotisation annuelle UNAPO",
    "Frais DNP", "Taux d'échange", "Prime Consulat", "Frais de mouton", "Prime des Guides",
]

CATEGORIES_OUMRA = [
    "Hôtel", "Billets", "Transport", "Visa", "Restauration",
    "Fournisseurs", "Salaires", "Missions", "Communication",
]

CATEGORIES_PERSONNEL = [
    "Budget de fonctionnement", "Impôt Etax", "Cotisation CNSS",
    "Recharge box wifi", "Loyer du bureau", "Frais prélèvement annuel UBA",
    "Badge pèlerins", "Réunion Guide-pèlerins", "Sacrifice annuel",
    "Facture Électricité", "Facture Eau", "Étiquettes bagage",
    "Étiquette passeport", "Écharpe pèlerin",
]


def creer_categories(apps, schema_editor):
    CategorieDecaissement = apps.get_model("comptabilite", "CategorieDecaissement")
    for i, nom in enumerate(CATEGORIES_HAJJ):
        CategorieDecaissement.objects.get_or_create(activite="hajj", nom=nom, defaults={"ordre": i})
    for i, nom in enumerate(CATEGORIES_OUMRA):
        CategorieDecaissement.objects.get_or_create(activite="oumra", nom=nom, defaults={"ordre": i})
    for i, nom in enumerate(CATEGORIES_PERSONNEL):
        CategorieDecaissement.objects.get_or_create(activite="personnel", nom=nom, defaults={"ordre": i})


class Migration(migrations.Migration):
    dependencies = [("comptabilite", "0001_initial")]  # ajuste selon ta numérotation réelle
    operations = [migrations.RunPython(creer_categories, migrations.RunPython.noop)]



from django.db import migrations


def creer_associes(apps, schema_editor):
    Associe = apps.get_model("comptabilite", "Associe")
    Associe.objects.get_or_create(nom_complet="N'FAMBA IBRAHIMA KABA", defaults={"pourcentage_part": 30, "ordre": 1})
    Associe.objects.get_or_create(nom_complet="Mohamed Ahmad Diallo", defaults={"pourcentage_part": 30, "ordre": 2})
    Associe.objects.get_or_create(nom_complet="Aboubacar Ahmad Diallo", defaults={"pourcentage_part": 30, "ordre": 3})
    Associe.objects.get_or_create(nom_complet="La caisse", defaults={"pourcentage_part": 10, "est_caisse": True, "ordre": 4})


class Migration(migrations.Migration):
    dependencies = [("comptabilite", "0002_seed_categories_decaissement")]  # ajuste
    operations = [migrations.RunPython(creer_associes, migrations.RunPython.noop)]

class TauxChange(models.Model):
    taux_usd = models.DecimalField(max_digits=10, decimal_places=2, help_text="Nombre de GNF pour 1 USD")
    taux_sar = models.DecimalField(max_digits=10, decimal_places=2, help_text="Nombre de GNF pour 1 SAR")
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Taux de change"

    def __str__(self):
        return f"1 USD = {self.taux_usd} GNF — 1 SAR = {self.taux_sar} GNF"

