import requests
import django_filters
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from django.template import engines
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from xhtml2pdf import pisa
from openpyxl import Workbook
from auditlog.models import LogEntry
from auditlog.context import set_actor

from activite.serializers import EntreeJournalDetailSerializer
from documents_generes.models import ModeleDocument
from .models import Pelerin, QuotaInscription, HistoriqueQuota
from .serializers import PelerinSerializer
from .pdf_utils import link_callback, envelopper_avec_entete_pied

django_engine = engines["django"]

# ---------- Quotas d'inscription (Hajj / Oumra, remis à zéro chaque année) ----------
TYPE_VOYAGE_PAR_ACTIVITE = {"hajj": "pelerinage", "oumra": "oumra"}
ACTIVITE_PAR_TYPE_VOYAGE = {v: k for k, v in TYPE_VOYAGE_PAR_ACTIVITE.items()}

# Rôles autorisés à créer / modifier le quota (en plus des super-utilisateurs).
# "admin_general" = l'administrateur général de l'application.
ROLES_AUTORISES_QUOTA = ("fondateur", "admin_general", "administrateur", "admin")

MESSAGE_QUOTA_ATTEINT = (
    "Vous avez atteint le nombre maximal de pèlerins autorisé. "
    "Pour enregistrer un nouveau pèlerin, veuillez d'abord modifier le quota dans les paramètres."
)


def peut_modifier_quota(user):
    return bool(
        user.is_authenticated
        and (user.is_superuser or getattr(user, "role", "") in ROLES_AUTORISES_QUOTA)
    )


def etat_quota(activite, annee):
    """Retourne (objet quota ou None, dictionnaire d'état) pour une activité et une année."""
    inscrits = Pelerin.objects.filter(
        type_voyage=TYPE_VOYAGE_PAR_ACTIVITE[activite], date_inscription__year=annee
    ).count()
    quota_obj = QuotaInscription.objects.filter(activite=activite, annee=annee).first()
    quota = quota_obj.quota if quota_obj else None
    return quota_obj, {
        "activite": activite,
        "annee": annee,
        "quota": quota,
        "inscrits": inscrits,
        "restantes": max(quota - inscrits, 0) if quota is not None else None,
        "atteint": quota is not None and inscrits >= quota,
    }


def nom_utilisateur(user):
    if not user:
        return None
    nom = user.get_full_name()
    return nom if nom and nom.strip() else user.get_username()


CHAMPS_DOCUMENTS = ["photo", "scan_passeport", "scan_visa", "scan_certificat_medical", "scan_recu_versement"]


# Agences : un pèlerin sans agence partenaire appartient à BATE VOYAGE GUINÉE.
# Chaque nom regroupe les différentes écritures possibles du champ "agence_partenaire".
AGENCES_FILTRE = {
    "BATE VOYAGE GUINÉE": ["", "BATE VOYAGE GUINÉE"],
    "INTER-DJIGUI": ["INTER-DJIGUI"],
    "MANDEN VOYAGE": ["MANDENG VOYAGE GUINÉE", "MANDEN VOYAGE"],
}


class PelerinFilter(django_filters.FilterSet):
    annee = django_filters.NumberFilter(field_name="date_inscription", lookup_expr="year")
    guide = django_filters.NumberFilter(field_name="groupe__encadreur_id")
    agence = django_filters.CharFilter(method="filtrer_agence")

    def filtrer_agence(self, queryset, name, value):
        valeurs = AGENCES_FILTRE.get(value)
        if valeurs is None:
            return queryset.filter(agence_partenaire__iexact=value)
        if "" in valeurs:
            return queryset.filter(Q(agence_partenaire__in=valeurs) | Q(agence_partenaire__isnull=True))
        return queryset.filter(agence_partenaire__in=valeurs)

    class Meta:
        model = Pelerin
        fields = ["statut", "statut_visa", "sexe", "type_voyage", "inscripteur",
                  "programme", "groupe", "chambre", "vehicule", "campement", "annee", "guide", "agence"]


class PelerinViewSet(viewsets.ModelViewSet):
    queryset = Pelerin.objects.select_related("programme", "groupe", "chambre").all()
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    # SearchFilter doit être déclaré ici : les réglages globaux n'activent que DjangoFilterBackend,
    # sinon le paramètre ?search= est ignoré.
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PelerinFilter
    search_fields = ["nom", "prenom", "numero_id", "numero_passeport", "telephone", "inscripteur"]

    def _verifier_quota(self, type_voyage):
        """Bloque l'inscription si le quota de l'année en cours est atteint."""
        activite = ACTIVITE_PAR_TYPE_VOYAGE.get(type_voyage)
        if not activite:
            return
        annee = timezone.now().year
        # Verrou sur la ligne du quota : deux inscriptions simultanées ne peuvent pas dépasser la limite.
        quota = QuotaInscription.objects.select_for_update().filter(activite=activite, annee=annee).first()
        if quota is None:
            return
        _, etat = etat_quota(activite, annee)
        if etat["inscrits"] >= quota.quota:
            raise ValidationError({"quota_atteint": [MESSAGE_QUOTA_ATTEINT]})

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            with transaction.atomic():
                self._verifier_quota(serializer.validated_data.get("type_voyage"))
                pelerin = serializer.save()
                if pelerin.montant_verse and float(pelerin.montant_verse) > 0:
                    from paiements.models import Paiement
                    Paiement.objects.create(
                        pelerin=pelerin,
                        montant=pelerin.montant_verse,
                        mode_paiement=pelerin.mode_paiement or Paiement.ModePaiement.ESPECES,
                        date_paiement=timezone.now().date(),
                        enregistre_par=self.request.user,
                        notes="Versement initial à l'inscription",
                    )

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    def _reponse_quota(self, activite, annee, statut=200):
        _, etat = etat_quota(activite, annee)
        historique = HistoriqueQuota.objects.filter(
            quota_inscription__activite=activite
        ).select_related("modifie_par", "quota_inscription")[:30]
        etat["peut_modifier"] = peut_modifier_quota(self.request.user)
        etat["historique"] = [
            {
                "annee": h.quota_inscription.annee,
                "ancien_quota": h.ancien_quota,
                "nouveau_quota": h.nouveau_quota,
                "date": h.date_modification.isoformat(),
                "utilisateur": nom_utilisateur(h.modifie_par),
            }
            for h in historique
        ]
        return Response(etat, status=statut)

    @action(detail=False, methods=["get", "post"], url_path="quota")
    def quota(self, request):
        """GET : état du quota (activite=hajj|oumra). POST : définir ou modifier le quota."""
        source = request.data if request.method == "POST" else request.query_params
        activite = source.get("activite")
        if activite not in TYPE_VOYAGE_PAR_ACTIVITE:
            return Response({"erreur": "Activité invalide : hajj ou oumra."}, status=400)
        annee = timezone.now().year

        if request.method == "GET":
            return self._reponse_quota(activite, annee)

        if not peut_modifier_quota(request.user):
            return Response({"erreur": "Vous n'avez pas l'autorisation de modifier le quota."}, status=403)
        try:
            nouveau = int(request.data.get("quota"))
        except (TypeError, ValueError):
            return Response({"erreur": "Le quota doit être un nombre entier."}, status=400)
        if nouveau < 1:
            return Response({"erreur": "Le quota doit être au moins 1."}, status=400)

        with transaction.atomic():
            quota_obj = QuotaInscription.objects.select_for_update().filter(activite=activite, annee=annee).first()
            _, etat = etat_quota(activite, annee)
            if nouveau < etat["inscrits"]:
                return Response(
                    {"erreur": f"Le quota ne peut pas être inférieur au nombre de pèlerins déjà inscrits ({etat['inscrits']})."},
                    status=400,
                )
            ancien = quota_obj.quota if quota_obj else None
            if quota_obj is None:
                quota_obj = QuotaInscription.objects.create(activite=activite, annee=annee, quota=nouveau)
            elif ancien != nouveau:
                quota_obj.quota = nouveau
                quota_obj.save()
            if ancien != nouveau:
                HistoriqueQuota.objects.create(
                    quota_inscription=quota_obj,
                    ancien_quota=ancien,
                    nouveau_quota=nouveau,
                    modifie_par=request.user,
                )
        return self._reponse_quota(activite, annee)

    @action(detail=True, methods=["get"], url_path="fiche-pdf")
    def fiche_pdf(self, request, pk=None):
        pelerin = self.get_object()
        html = render_to_string("pelerins/fiche_inscription.html", {"p": pelerin})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="fiche_{pelerin.numero_id}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["get"], url_path="document/(?P<champ>[^/.]+)")
    def document(self, request, pk=None, champ=None):
        if champ not in CHAMPS_DOCUMENTS:
            raise Http404("Champ de document invalide.")

        pelerin = self.get_object()
        fichier = getattr(pelerin, champ, None)
        if not fichier:
            raise Http404("Aucun document pour ce champ.")

        reponse_cloudinary = requests.get(fichier.url)

        if reponse_cloudinary.status_code != 200:
            return Response(
                {"erreur": f"Cloudinary a renvoyé le statut {reponse_cloudinary.status_code} pour ce fichier."},
                status=502,
            )

        content_type = reponse_cloudinary.headers.get("Content-Type", "")
        contenu = reponse_cloudinary.content

        if "text/html" in content_type or len(contenu) < 200:
            return Response(
                {"erreur": "Le fichier renvoyé par Cloudinary semble invalide ou vide."},
                status=502,
            )

        nom_fichier = fichier.name.split("/")[-1]

        response = HttpResponse(contenu, content_type=content_type or "application/octet-stream")
        response["Content-Disposition"] = f'inline; filename="{nom_fichier}"'
        response["X-Nom-Fichier-Reel"] = nom_fichier
        return response

    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        pelerin = self.get_object()
        content_type = ContentType.objects.get_for_model(Pelerin)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(pelerin.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="verifier-suppression")
    def verifier_suppression(self, request, pk=None):
        pelerin = self.get_object()
        nb_paiements = pelerin.paiements.count()
        total_paiements = pelerin.montant_total_verse
        return Response({
            "nb_paiements": nb_paiements,
            "total_paiements": total_paiements,
        })

    @action(detail=False, methods=["get"], url_path="export-excel")
    def export_excel(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        wb = Workbook()
        ws = wb.active
        ws.title = "Pèlerins"
        ws.append(["N° Dossier", "Nom", "Prénom", "Sexe", "Téléphone", "N° Passeport", "Type", "Statut", "Inscripteur", "Agence"])

        for p in queryset:
            ws.append([
                p.numero_id, p.nom, p.prenom, p.get_sexe_display(), p.telephone, p.numero_passeport,
                p.get_type_voyage_display(), p.get_statut_display(), p.inscripteur or "",
                p.agence_partenaire or "BATE VOYAGE GUINÉE",
            ])

        response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="pelerins_export.xlsx"'
        wb.save(response)
        return response

    @action(detail=False, methods=["get"], url_path="export-pdf")
    def export_pdf(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        html = render_to_string("pelerins/liste_pelerins.html", {"pelerins": queryset})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="liste_pelerins.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["get"], url_path="fiche-visa")
    def fiche_visa(self, request, pk=None):
        pelerin = self.get_object()
        html = render_to_string("pelerins/fiche_visa.html", {"p": pelerin})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="visa_{pelerin.numero_id}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=True, methods=["get"], url_path="document-genere/(?P<type_doc>[^/.]+)")
    def document_genere(self, request, pk=None, type_doc=None):
        pelerin = self.get_object()
        try:
            modele = ModeleDocument.objects.get(type_document=type_doc)
        except ModeleDocument.DoesNotExist:
            return Response({"erreur": "Type de document inconnu."}, status=404)

        corps_nettoye = modele.corps_html.replace("&nbsp;", " ")
        template_corps = django_engine.from_string(corps_nettoye)
        corps_rendu = template_corps.render({
            "p": pelerin,
            "paiements": pelerin.paiements.all(),
            "aujourdhui": timezone.now().date().strftime("%d/%m/%Y"),
        })

        html_complet = envelopper_avec_entete_pied(corps_rendu)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{type_doc}_{pelerin.numero_id}.pdf"'
        resultat = pisa.CreatePDF(html_complet, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response