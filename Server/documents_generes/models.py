from django.db import models

# Create your models here.
from django.db import models


class ModeleDocument(models.Model):
    class TypeDocument(models.TextChoices):
        ATTESTATION_INSCRIPTION = "attestation_inscription", "Attestation d'inscription"
        ATTESTATION_PAIEMENT = "attestation_paiement", "Attestation de paiement"
        CONTRAT = "contrat", "Contrat de prestation"
        ATTESTATION_SANTE = "attestation_sante", "Attestation de santé"

    type_document = models.CharField(max_length=30, choices=TypeDocument.choices, unique=True)
    titre = models.CharField(max_length=200)
    corps_html = models.TextField(
        help_text="Contenu du document. Utilisez {{ p.prenom }}, {{ p.nom }}, {{ p.numero_id }}, "
                   "{{ p.numero_passeport }}, {{ p.montant_total_verse }}, {{ aujourdhui }}, etc. "
                   "Pour les paiements, utilisez {% for paiement in paiements %}...{% endfor %}."
    )
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Modèle de document"
        verbose_name_plural = "Modèles de documents"

    def __str__(self):
        return self.titre