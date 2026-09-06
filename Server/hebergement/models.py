from django.db import models


class Ville(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["nom"]
        verbose_name = "Ville"
        verbose_name_plural = "Villes"

    def __str__(self):
        return self.nom


class Hotel(models.Model):
    class Categorie(models.TextChoices):
        ECONOMIQUE = "economique", "Économique"
        STANDARD = "standard", "Standard"
        SUPERIEUR = "superieur", "Supérieur"
        LUXE = "luxe", "Luxe"

    nom = models.CharField(max_length=150)
    ville = models.ForeignKey(Ville, on_delete=models.PROTECT, related_name="hotels")
    adresse = models.CharField(max_length=255, blank=True)
    categorie = models.CharField(max_length=20, choices=Categorie.choices, blank=True)
    distance_haram_metres = models.PositiveIntegerField(null=True, blank=True, help_text="Distance du Haram en mètres")
    nombre_chambres_prevu = models.PositiveIntegerField(null=True, blank=True, help_text="Nombre de chambres réservées (prévisionnel)")
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
        return f"{self.nom} ({self.ville})"


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

    @property
    def erreurs_affectation(self):
        """Détecte automatiquement les problèmes de rooming — actuellement :
        mélange d'hommes et de femmes dans une même chambre (hors cas
        individuel où la mixité n'a pas de sens)."""
        erreurs = []
        occupants = list(self.pelerins.all())
        if len(occupants) > 1:
            sexes = set(p.sexe for p in occupants if p.sexe)
            if len(sexes) > 1:
                erreurs.append("mixite_genre")
        if self.occupants_actuels > self.capacite:
            erreurs.append("capacite_depassee")
        return erreurs


class Campement(models.Model):
    """Hébergement sous tente pour Mina, Arafat, Muzdalifah — structure
    différente d'un hôtel classique, avec des champs alphanumériques
    libres (numérotation de tente/zone pouvant mélanger chiffres et
    lettres, ex: "T-12A")."""

    ville = models.ForeignKey(Ville, on_delete=models.PROTECT, related_name="campements")
    tente_camp = models.CharField(max_length=50, help_text="Numéro ou nom de la tente/camp (ex: T-12A)")
    groupe = models.CharField(max_length=100, blank=True, help_text="Nom du groupe affecté")
    zone = models.CharField(max_length=100, blank=True, help_text="Zone du site (ex: Zone 3, Secteur B)")
    affectation = models.CharField(max_length=150, blank=True, help_text="Détail d'affectation libre")
    capacite = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ville", "tente_camp"]
        verbose_name = "Campement"
        verbose_name_plural = "Campements"

    def __str__(self):
        return f"{self.tente_camp} — {self.ville}"

    @property
    def occupants_actuels(self):
        return self.pelerins.count()