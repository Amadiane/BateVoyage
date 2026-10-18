from django.db import models


class Programme(models.Model):
    class Type(models.TextChoices):
        HAJJ = "hajj", "Hajj"
        OUMRA_RAMADAN = "oumra_ramadan", "Oumra Ramadan"
        OUMRA_CLASSIQUE = "oumra_classique", "Oumra classique"
        OUMRA_SPECIALE = "oumra_speciale", "Oumra spéciale"

    class Statut(models.TextChoices):
        BROUILLON = "brouillon", "Brouillon"
        OUVERT = "ouvert", "Ouvert aux inscriptions"
        COMPLET = "complet", "Complet"
        CLOTURE = "cloture", "Clôturé"
        ARCHIVE = "archive", "Archivé"

    nom = models.CharField(max_length=150)
    reference = models.CharField(max_length=30, unique=True, null=True, blank=True, editable=False)
    type_programme = models.CharField(max_length=20, choices=Type.choices)
    annee = models.PositiveIntegerField(help_text="Année de la campagne (ex: 2024)")
    date_depart = models.DateField()
    date_retour = models.DateField()
    date_limite_paiement = models.DateField(
        null=True, blank=True,
        help_text="Date à laquelle le solde doit être intégralement payé"
    )
    prix = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    nombre_max_pelerins = models.PositiveIntegerField(null=True, blank=True)
    responsable = models.CharField(max_length=150, blank=True)
    statut = models.CharField(max_length=15, choices=Statut.choices, default=Statut.OUVERT)
    planning_valide = models.BooleanField(default=False, help_text="Le planning validé peut être exporté en PDF")
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

    @property
    def duree_nuits(self):
        return max((self.date_retour - self.date_depart).days, 0)

    @property
    def duree_jours(self):
        return self.duree_nuits + 1

    def save(self, *args, **kwargs):
        if not self.reference and self.type_programme.startswith("oumra"):
            prefixe = f"OMR-{self.annee}-"
            existantes = Programme.objects.filter(reference__startswith=prefixe).values_list("reference", flat=True)
            dernier = max((int(r.rsplit("-", 1)[1]) for r in existantes), default=0)
            self.reference = f"{prefixe}{dernier + 1:03d}"
        if self.statut == self.Statut.ARCHIVE:
            self.est_archive = True
        super().save(*args, **kwargs)


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


class SejourProgramme(models.Model):
    """Séjour hôtelier d'un programme Oumra (Makkah ou Médine)."""

    class Ville(models.TextChoices):
        MAKKAH = "makkah", "Makkah"
        MEDINE = "medine", "Médine"

    class TypeChambre(models.TextChoices):
        INDIVIDUELLE = "individuelle", "Individuelle"
        DOUBLE = "double", "Double"
        TRIPLE = "triple", "Triple"
        QUADRUPLE = "quadruple", "Quadruple"
        QUINTUPLE = "quintuple", "Quintuple"
        SEXTUPLE = "sextuple", "Sextuple"

    CAPACITES = {"individuelle": 1, "double": 2, "triple": 3, "quadruple": 4, "quintuple": 5, "sextuple": 6}

    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name="sejours")
    ville = models.CharField(max_length=10, choices=Ville.choices)
    hotel = models.ForeignKey(
        "hebergement.Hotel", on_delete=models.SET_NULL, null=True, blank=True, related_name="sejours_programmes"
    )
    hotel_nom = models.CharField(max_length=150, blank=True)
    hotel_adresse = models.CharField(max_length=255, blank=True)
    date_arrivee = models.DateField(null=True, blank=True)
    date_depart = models.DateField(null=True, blank=True)
    distance_haram_metres = models.PositiveIntegerField(null=True, blank=True, help_text="Distance de la Mosquée sacrée")
    type_chambre = models.CharField(max_length=15, choices=TypeChambre.choices, blank=True)
    capacite_chambre = models.PositiveIntegerField(null=True, blank=True)
    repas_inclus = models.TextField(blank=True)
    prestations_incluses = models.TextField(blank=True)
    visites_ziyarat = models.TextField(blank=True)
    activites_religieuses = models.TextField(blank=True)
    transport = models.CharField(max_length=200, blank=True)
    responsable = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["date_arrivee", "id"]
        verbose_name = "Séjour de programme"
        verbose_name_plural = "Séjours de programme"

    @property
    def nombre_nuits(self):
        if self.date_arrivee and self.date_depart:
            return max((self.date_depart - self.date_arrivee).days, 0)
        return None

    def save(self, *args, **kwargs):
        if not self.capacite_chambre and self.type_chambre:
            self.capacite_chambre = self.CAPACITES.get(self.type_chambre)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.programme.nom} — {self.get_ville_display()}"


class TransportProgramme(models.Model):
    class TypeTrajet(models.TextChoices):
        AEROPORT_HOTEL = "aeroport_hotel", "Aéroport → hôtel"
        MAKKAH_MEDINE = "makkah_medine", "Makkah → Médine"
        MEDINE_AEROPORT = "medine_aeroport", "Médine → aéroport"
        AUTRE = "autre", "Autre"

    class Statut(models.TextChoices):
        PLANIFIE = "planifie", "Planifié"
        CONFIRME = "confirme", "Confirmé"
        EN_COURS = "en_cours", "En cours"
        TERMINE = "termine", "Terminé"
        ANNULE = "annule", "Annulé"

    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name="transports")
    type_trajet = models.CharField(max_length=20, choices=TypeTrajet.choices)
    type_vehicule = models.CharField(max_length=100, blank=True)
    prestataire = models.CharField(max_length=150, blank=True)
    date_heure = models.DateTimeField(null=True, blank=True)
    nombre_pelerins = models.PositiveIntegerField(null=True, blank=True)
    chauffeur_nom = models.CharField(max_length=150, blank=True)
    chauffeur_contact = models.CharField(max_length=50, blank=True)
    statut = models.CharField(max_length=15, choices=Statut.choices, default=Statut.PLANIFIE)

    class Meta:
        ordering = ["date_heure", "id"]
        verbose_name = "Transport de programme"
        verbose_name_plural = "Transports de programme"

    def __str__(self):
        return f"{self.programme.nom} — {self.get_type_trajet_display()}"


class ActivitePlanning(models.Model):
    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name="planning")
    date = models.DateField()
    ville = models.CharField(max_length=100, blank=True)
    heure = models.TimeField(null=True, blank=True)
    activite = models.CharField(max_length=200)
    lieu = models.CharField(max_length=200, blank=True)
    responsable = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["date", "heure", "id"]
        verbose_name = "Activité du planning"
        verbose_name_plural = "Activités du planning"

    def __str__(self):
        return f"{self.date} — {self.activite}"