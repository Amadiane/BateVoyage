from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from django.utils import timezone
from utilisateurs.storage import RawMediaCloudinaryStorage


class FichePersonnel(models.Model):
    class Langue(models.TextChoices):
        FRANCAIS = "francais", "Français"
        ARABE = "arabe", "Arabe"
        ANGLAIS = "anglais", "Anglais"
        PEUL = "peul", "Peul"
        MALINKE = "malinke", "Malinké"
        SOUSSOU = "soussou", "Soussou"

    class Disponibilite(models.TextChoices):
        ACTIF = "actif", "Actif cette saison"
        CONGE = "conge", "En congé"
        INDISPONIBLE = "indisponible", "Indisponible"

    class ZoneCompetence(models.TextChoices):
        MECQUE = "mecque", "Mecque"
        MEDINE = "medine", "Médine"
        LES_DEUX = "les_deux", "Les deux"

    class ZoneAffectation(models.TextChoices):
        MECQUE = "mecque", "Mecque"
        MEDINE = "medine", "Médine"
        TRANSPORT = "transport", "Transport"
        AEROPORT = "aeroport", "Aéroport"

    # ---------- Lien vers le compte utilisateur ----------
    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fiche_personnel",
        limit_choices_to={"role__in": ["guide", "encadreur", "docteur", "mounazim"]},
    )
    matricule = models.CharField(max_length=20, unique=True, editable=False, blank=True)

    # ---------- Champs communs ----------
    numero_piece_identite = models.CharField(max_length=50, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    commune = models.CharField(max_length=100, blank=True)
    langues_parlees = models.CharField(max_length=255, blank=True, help_text="Séparées par des virgules")
    nombre_saisons_experience = models.PositiveIntegerField(default=0)
    contact_urgence_nom = models.CharField(max_length=150, blank=True)
    contact_urgence_telephone = models.CharField(max_length=20, blank=True)
    disponibilite = models.CharField(max_length=20, choices=Disponibilite.choices, default=Disponibilite.ACTIF)
    scan_cv = models.FileField(
        upload_to="personnel/cv/", storage=RawMediaCloudinaryStorage(), blank=True, null=True
    )

    # ---------- Champs spécifiques Docteur ----------
    specialite_medicale = models.CharField(max_length=150, blank=True)
    numero_ordre_medecins = models.CharField(max_length=50, blank=True)
    etablissement_exercice = models.CharField(max_length=150, blank=True)

    # ---------- Champs spécifiques Guide / Mounazim ----------
    formation_religieuse = models.CharField(max_length=255, blank=True)
    zone_competence = models.CharField(max_length=15, choices=ZoneCompetence.choices, blank=True)

    # ---------- Champs spécifiques Encadreur ----------
    zone_affectation = models.CharField(max_length=15, choices=ZoneAffectation.choices, blank=True)
    capacite_max_pelerins = models.PositiveIntegerField(null=True, blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Fiche personnel"
        verbose_name_plural = "Fiches personnel"

    def save(self, *args, **kwargs):
        if not self.matricule:
            annee = str(timezone.now().year)[-2:]
            prefixe = {"guide": "GD", "encadreur": "ENC", "docteur": "DOC", "mounazim": "MZ"}.get(self.utilisateur.role, "PER")
            dernier = FichePersonnel.objects.filter(matricule__startswith=f"{prefixe}-").count()
            self.matricule = f"{prefixe}-{dernier + 1:03d}-{annee}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.matricule} — {self.utilisateur.get_full_name() or self.utilisateur.username}"