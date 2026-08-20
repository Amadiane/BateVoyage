from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from utilisateurs.storage import RawMediaCloudinaryStorage
from pelerins.models import Pelerin


class SequenceRecu(models.Model):
    annee = models.CharField(max_length=4, unique=True)
    dernier_numero = models.PositiveIntegerField(default=0)


class Paiement(models.Model):
    class ModePaiement(models.TextChoices):
        ESPECES = "especes", "Espèces"
        ORANGE_MONEY = "orange_money", "Orange Money"
        VIREMENT = "virement", "Virement bancaire"

    numero_recu = models.CharField(max_length=20, unique=True, editable=False, blank=True)
    pelerin = models.ForeignKey(Pelerin, on_delete=models.CASCADE, related_name="paiements")
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    mode_paiement = models.CharField(max_length=20, choices=ModePaiement.choices)
    reference = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateField()
    scan_recu = models.FileField(
        upload_to="paiements/recus/", storage=RawMediaCloudinaryStorage(),
        blank=True, null=True
    )
    notes = models.TextField(blank=True)
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="paiements_enregistres"
    )
    motif_suppression = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_paiement", "-date_creation"]
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"

    def __str__(self):
        return f"{self.numero_recu} — {self.montant} GNF ({self.pelerin.numero_id})"

    def save(self, *args, **kwargs):
        if not self.numero_recu:
            self.numero_recu = self._generer_numero_recu()
        super().save(*args, **kwargs)

    @staticmethod
    def _generer_numero_recu():
        annee_courante = str(timezone.now().year)[-2:]
        with transaction.atomic():
            sequence, _ = SequenceRecu.objects.select_for_update().get_or_create(
                annee=annee_courante, defaults={"dernier_numero": 0}
            )
            sequence.dernier_numero += 1
            sequence.save()
            return f"REC-{sequence.dernier_numero:04d}-{annee_courante}"