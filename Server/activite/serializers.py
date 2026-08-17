import json
from rest_framework import serializers
from auditlog.models import LogEntry

LIBELLES_ACTION = {
    LogEntry.Action.CREATE: "creation",
    LogEntry.Action.UPDATE: "modification",
    LogEntry.Action.DELETE: "suppression",
}

LIBELLES_MODELE = {
    "pelerin": "Pèlerin",
    "utilisateur": "Utilisateur",
    "programme": "Programme",
}


class EntreeJournalSerializer(serializers.ModelSerializer):
    """Vue 'grandes lignes' — pour le journal central, sans le détail des champs."""
    action_libelle = serializers.SerializerMethodField()
    utilisateur_nom = serializers.SerializerMethodField()
    modele = serializers.SerializerMethodField()
    modele_libelle = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = ["id", "action", "action_libelle", "object_repr", "object_pk",
                  "modele", "modele_libelle", "utilisateur_nom", "timestamp"]

    def get_action_libelle(self, obj):
        return LIBELLES_ACTION.get(obj.action, "action")

    def get_utilisateur_nom(self, obj):
        if not obj.actor:
            return "Système"
        nom = obj.actor.get_full_name()
        return nom if nom.strip() else obj.actor.username

    def get_modele(self, obj):
        return obj.content_type.model if obj.content_type else None

    def get_modele_libelle(self, obj):
        cle = obj.content_type.model if obj.content_type else ""
        return LIBELLES_MODELE.get(cle, cle.capitalize())


class EntreeJournalDetailSerializer(EntreeJournalSerializer):
    """Vue détaillée — pour l'historique d'un dossier précis, avec le détail
    champ par champ (ancienne valeur → nouvelle valeur)."""
    changements = serializers.SerializerMethodField()

    class Meta(EntreeJournalSerializer.Meta):
        fields = EntreeJournalSerializer.Meta.fields + ["changements"]

    def get_changements(self, obj):
        if hasattr(obj, "changes_dict"):
            return obj.changes_dict
        try:
            return json.loads(obj.changes) if obj.changes else {}
        except (TypeError, ValueError):
            return {}