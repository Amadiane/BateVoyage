from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from utilisateurs.storage import RawMediaCloudinaryStorage


class SequenceInscription(models.Model):
    """Compteur annuel utilisé pour générer les ID pèlerins (BVG-001-P26).
    Une nouvelle ligne est créée à chaque nouvelle année, ce qui remet
    naturellement la numérotation à 1."""
    annee = models.CharField(max_length=4, unique=True)
    dernier_numero = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Séquence {self.annee} — dernier n° {self.dernier_numero}"


class Pelerin(models.Model):
    class Sexe(models.TextChoices):
        HOMME = "M", "Homme"
        FEMME = "F", "Femme"

    class GroupeSanguin(models.TextChoices):
        A_POS = "A+", "A+"
        A_NEG = "A-", "A-"
        B_POS = "B+", "B+"
        B_NEG = "B-", "B-"
        AB_POS = "AB+", "AB+"
        AB_NEG = "AB-", "AB-"
        O_POS = "O+", "O+"
        O_NEG = "O-", "O-"

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

    # ---------- 1. Identifiant ----------
    numero_id = models.CharField(max_length=20, unique=True, editable=False)

    # ---------- 2-4. Identité ----------
    prenom = models.CharField(max_length=100)
    nom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=Sexe.choices)

    # ---------- 5,8,9. Passeport ----------
    numero_passeport = models.CharField(max_length=30)
    date_emission_passeport = models.DateField()
    date_expiration_passeport = models.DateField()
    scan_passeport = models.FileField(
        upload_to="pelerins/passeports/", storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )
    statut_visa = models.CharField(max_length=20, choices=StatutVisa.choices, default=StatutVisa.NON_DEMANDE)

    # ---------- 6-7. Naissance ----------
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=150)

    # ---------- 10-11. Adresse ----------
    commune = models.CharField(max_length=100)
    quartier = models.CharField(max_length=100)

    # ---------- 12. Filiation ----------
    nom_pere = models.CharField("Nom du père", max_length=150, blank=True)
    nom_mere = models.CharField("Nom de la mère", max_length=150, blank=True)

    # ---------- 13. Versement ----------
    montant_verse = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    scan_recu_versement = models.FileField(
        upload_to="pelerins/recus/", storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )

    # ---------- 14. Inscripteur ----------
    inscripteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="pelerins_inscrits",
        limit_choices_to={"role__in": ["fondateur", "admin_general", "secretaire", "comptable"]},
    )

    # ---------- 15. Correspondant (= téléphone d'urgence) ----------
    nom_correspondant = models.CharField(max_length=150)
    telephone_correspondant = models.CharField(max_length=20)

    # ---------- 16. Agence partenaire ----------
    agence_partenaire = models.CharField(
        max_length=150, blank=True,
        help_text="À remplir uniquement si le pèlerin vient d'une agence partenaire."
    )

    # ---------- 17. Téléphone ----------
    telephone = models.CharField(max_length=20)

    # ---------- 19. Photo ----------
    photo = models.ImageField(upload_to="pelerins/photos/", blank=True, null=True)

    # ---------- 20. Certificat médical ----------
    scan_certificat_medical = models.FileField(
        upload_to="pelerins/certificats_medicaux/", storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )

    # ---------- 22-23. Santé ----------
    groupe_sanguin = models.CharField(max_length=3, choices=GroupeSanguin.choices, blank=True)
    probleme_sante = models.TextField(blank=True)

    # ---------- Rattachement programme (Hajj/Oumra) ----------
    programme = models.ForeignKey(
        "formules.Programme", on_delete=models.SET_NULL, null=True, blank=True, related_name="pelerins"
    )

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.INSCRIT)
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pèlerin"
        verbose_name_plural = "Pèlerins"
        ordering = ["-date_inscription"]

    def __str__(self):
        return f"{self.numero_id} — {self.prenom} {self.nom}"

    @property
    def telephone_urgence(self):
        return self.telephone_correspondant

    @property
    def dossier_complet(self):
        return bool(
            self.numero_passeport and self.scan_passeport and
            self.statut_visa == self.StatutVisa.OBTENU and
            self.scan_certificat_medical
        )

    def save(self, *args, **kwargs):
        if not self.numero_id:
            self.numero_id = self._generer_numero_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generer_numero_id():
        annee_courante = str(timezone.now().year)[-2:]  # ex: "26" pour 2026
        with transaction.atomic():
            sequence, _ = SequenceInscription.objects.select_for_update().get_or_create(
                annee=annee_courante, defaults={"dernier_numero": 0}
            )
            sequence.dernier_numero += 1
            sequence.save()
            return f"BVG-{sequence.dernier_numero:03d}-P{annee_courante}"