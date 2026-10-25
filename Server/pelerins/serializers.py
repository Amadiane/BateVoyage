from django.utils import timezone
from rest_framework import serializers
from .models import Pelerin


class PelerinSerializer(serializers.ModelSerializer):
    sexe_display = serializers.CharField(source="get_sexe_display", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    statut_visa_display = serializers.CharField(source="get_statut_visa_display", read_only=True)
    type_voyage_display = serializers.CharField(source="get_type_voyage_display", read_only=True)
    mode_paiement_display = serializers.CharField(source="get_mode_paiement_display", read_only=True)
    montant_total_verse = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    telephone_urgence = serializers.CharField(read_only=True)
    dossier_complet = serializers.BooleanField(read_only=True)
    reste_a_payer = serializers.SerializerMethodField()
    prix_programme = serializers.SerializerMethodField()
    statut_paiement = serializers.CharField(read_only=True)
    jours_avant_echeance_paiement = serializers.IntegerField(read_only=True)
    groupe_nom = serializers.CharField(source="groupe.nom", read_only=True)
    chambre_info = serializers.SerializerMethodField()
    jours_avant_expiration_passeport = serializers.IntegerField(read_only=True)
    elements_manquants = serializers.SerializerMethodField()

    # Numéro individuel saisi à la main (ex : "1" ou "001" -> BVG-001-P26).
    # Champ d'entrée uniquement, utilisé à la création. Vide = numéro automatique.
    numero_individuel = serializers.CharField(
        write_only=True, required=False, allow_blank=True, max_length=6
    )

    class Meta:
        model = Pelerin
        fields = "__all__"
        read_only_fields = ["numero_id", "date_inscription"]

    def validate_numero_individuel(self, valeur):
        valeur = (valeur or "").strip()
        if not valeur:
            return ""
        if not valeur.isdigit() or int(valeur) < 1:
            raise serializers.ValidationError(
                "Le numéro individuel doit être un nombre positif (ex : 001)."
            )
        return valeur.zfill(3)

    def create(self, validated_data):
        numero = validated_data.pop("numero_individuel", "")
        if numero:
            annee = str(timezone.now().year)[-2:]
            numero_id = f"BVG-{numero}-P{annee}"
            if Pelerin.objects.filter(numero_id=numero_id).exists():
                raise serializers.ValidationError(
                    {"numero_individuel": f"L'identifiant {numero_id} existe déjà."}
                )
            validated_data["numero_id"] = numero_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Le numéro d'identification ne change pas après la création
        validated_data.pop("numero_individuel", None)
        return super().update(instance, validated_data)

    def get_elements_manquants(self, obj):
        manquants = []
        if not obj.photo:
            manquants.append("photo")
        if not obj.scan_passeport:
            manquants.append("scan_passeport")
        if obj.statut_visa in ["non_demande", "en_cours"]:
            manquants.append("visa")
        if not obj.scan_certificat_medical:
            manquants.append("certificat_medical")
        if not obj.groupe_sanguin:
            manquants.append("groupe_sanguin")
        if not obj.montant_total_verse or float(obj.montant_total_verse) == 0:
            manquants.append("paiement")
        return manquants

    def get_prix_programme(self, obj):
        if obj.programme and obj.programme.prix:
            return obj.programme.prix
        return None

    def get_reste_a_payer(self, obj):
        prix = self.get_prix_programme(obj)
        if prix is None:
            return None
        return float(prix) - float(obj.montant_total_verse)

    def get_chambre_info(self, obj):
        if not obj.chambre:
            return None
        return f"{obj.chambre.hotel.nom} — Ch. {obj.chambre.numero}"