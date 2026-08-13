import uuid
from django.db import models
from django.conf import settings
from utilisateurs.storage import RawMediaCloudinaryStorage


class Pelerin(models.Model):
    class Statut(models.TextChoices):
        INSCRIT = "inscrit", "Inscrit"
        EN_PREPARATION = "en_preparation", "En préparation"
        VALIDE = "valide", "Validé"
        EN_VOYAGE = "en_voyage", "En voyage"
        RETOURNE = "retourne", "Retourné"
        CLOTURE = "cloture", "Clôturé"

    class StatutVisa(models.TextChoices):
        NON_DEMANDE = "non_demande", "Non demandé"
        EN_COURS = "en_cours", "En cours (Nusuk)"
        OBTENU = "obtenu", "Obtenu"
        REFUSE = "refuse", "Refusé"

    # Compte de connexion optionnel (portail pèlerin)
    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="dossier_pelerin"
    )

    numero_dossier = models.CharField(max_length=20, unique=True, editable=False)

    # Identité
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField()
    genre = models.CharField(max_length=1, choices=[("M", "Homme"), ("F", "Femme")])
    telephone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    photo = models.ImageField(upload_to="pelerins/photos/", blank=True, null=True)

    # Contact urgence
    contact_urgence_nom = models.CharField(max_length=150, blank=True)
    contact_urgence_telephone = models.CharField(max_length=20, blank=True)

    # Passeport & Visa (documents = fichiers "raw", pas des images)
    numero_passeport = models.CharField(max_length=30, blank=True)
    date_expiration_passeport = models.DateField(null=True, blank=True)
    scan_passeport = models.FileField(
        upload_to="pelerins/passeports/",
        storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )
    statut_visa = models.CharField(max_length=20, choices=StatutVisa.choices, default=StatutVisa.NON_DEMANDE)

    # Santé
    certificat_vaccination = models.FileField(
        upload_to="pelerins/vaccination/",
        storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )
    date_expiration_vaccination = models.DateField(null=True, blank=True)

    # Programme
    programme = models.ForeignKey(
        "formules.Programme", on_delete=models.SET_NULL, null=True, blank=True, related_name="pelerins"
    )

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.INSCRIT)
    date_inscription = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            self.numero_dossier = f"BV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def dossier_complet(self):
        return bool(
            self.numero_passeport and self.scan_passeport and
            self.statut_visa == self.StatutVisa.OBTENU and
            self.certificat_vaccination
        )

    def __str__(self):
        return f"{self.numero_dossier} — {self.prenom} {self.nom}"

    class Meta:
        verbose_name = "Pèlerin"
        verbose_name_plural = "Pèlerins"