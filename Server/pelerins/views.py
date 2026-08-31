import requests
import django_filters
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from django.template import engines
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from xhtml2pdf import pisa
from openpyxl import Workbook
from auditlog.models import LogEntry
from auditlog.context import set_actor

from activite.serializers import EntreeJournalDetailSerializer
from documents_generes.models import ModeleDocument
from .models import Pelerin
from .serializers import PelerinSerializer
from .pdf_utils import link_callback

django_engine = engines["django"]

CHAMPS_DOCUMENTS = ["photo", "scan_passeport", "scan_certificat_medical", "scan_recu_versement"]


class PelerinFilter(django_filters.FilterSet):
    annee = django_filters.NumberFilter(field_name="date_creation", lookup_expr="year")
    guide = django_filters.NumberFilter(field_name="groupe__encadreur_id")

    class Meta:
        model = Pelerin
        fields = ["statut", "statut_visa", "sexe", "type_voyage", "inscripteur",
                  "programme", "groupe", "chambre", "annee", "guide"]


class PelerinViewSet(viewsets.ModelViewSet):
    queryset = Pelerin.objects.select_related("programme", "groupe", "chambre").all()
    serializer_class = PelerinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = PelerinFilter
    search_fields = ["nom", "prenom", "numero_id", "numero_passeport", "telephone", "inscripteur"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
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
        ws.append(["N° Dossier", "Nom", "Prénom", "Téléphone", "N° Passeport", "Type", "Statut", "Inscripteur"])

        for p in queryset:
            ws.append([
                p.numero_id, p.nom, p.prenom, p.telephone, p.numero_passeport,
                p.get_type_voyage_display(), p.get_statut_display(), p.inscripteur or "",
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

        html_complet = f"""
        <html>
        <head>
        <style>
          @page {{
            size: A4;
            margin-top: 4.8cm; margin-bottom: 2.6cm; margin-left: 1.5cm; margin-right: 1.5cm;
            @frame header_frame {{ -pdf-frame-content: header_content; top: 1cm; left: 1.5cm; right: 1.5cm; height: 3.6cm; }}
            @frame footer_frame {{ -pdf-frame-content: footer_content; bottom: 0.7cm; left: 1.5cm; right: 1.5cm; height: 1.6cm; }}
          }}
          body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1F2937; line-height: 1.6; }}
          #header_content img, #footer_content img {{ width: 100%; }}
          .titre-doc {{ font-size: 16px; font-weight: bold; color: #0B3FA0; text-align: center; margin: 8px 0 4px; }}
          .ligne-separation {{ border-bottom: 2px solid #0B3FA0; margin: 4px 0 20px; }}
          table.champs {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
          table.champs td {{ padding: 7px 4px; border-bottom: 1px solid #F0F1F3; font-size: 11.5px; }}
          table.champs td.label {{ width: 35%; font-weight: bold; color: #4B5563; }}
          table.champs td.valeur {{ width: 65%; color: #111827; }}
        </style>
        </head>
        <body>
          <div id="header_content"><img src="/static/pelerins/entete_bvg.png" /></div>
          <div id="footer_content"><img src="/static/pelerins/pied_bvg.png" /></div>
          {corps_rendu}
        </body>
        </html>
        """

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{type_doc}_{pelerin.numero_id}.pdf"'
        resultat = pisa.CreatePDF(html_complet, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response