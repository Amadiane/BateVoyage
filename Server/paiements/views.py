import requests
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from auditlog.context import set_actor
from xhtml2pdf import pisa
from pelerins.models import Pelerin

from pelerins.pdf_utils import link_callback
from .models import Paiement
from .serializers import PaiementSerializer
from utilisateurs.permissions import EstGestionnaireFinancier
import django_filters

from datetime import date
from django.db.models import Sum, Count
from rest_framework.views import APIView
from utilisateurs.permissions import EstGestionnaireFinancier

class PaiementFilter(django_filters.FilterSet):
    date_debut = django_filters.DateFilter(field_name="date_paiement", lookup_expr="gte")
    date_fin = django_filters.DateFilter(field_name="date_paiement", lookup_expr="lte")

    class Meta:
        model = Paiement
        fields = ["pelerin", "mode_paiement", "date_debut", "date_fin"]

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related("pelerin", "enregistre_par").all()
    serializer_class = PaiementSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_class = PaiementFilter
    search_fields = ["pelerin__nom", "pelerin__prenom", "pelerin__numero_id", "reference"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=True, methods=["get"], url_path="recu-scan")
    def recu_scan(self, request, pk=None):
        """Proxy sécurisé vers le reçu scanné du paiement — masque l'URL
        Cloudinary réelle, comme pour les documents pèlerin."""
        paiement = self.get_object()
        if not paiement.scan_recu:
            raise Http404("Aucun reçu scanné pour ce paiement.")

        reponse_cloudinary = requests.get(paiement.scan_recu.url)
        if reponse_cloudinary.status_code != 200:
            return Response({"erreur": "Document introuvable sur le stockage."}, status=502)

        content_type = reponse_cloudinary.headers.get("Content-Type", "application/octet-stream")
        nom_fichier = paiement.scan_recu.name.split("/")[-1]

        response = HttpResponse(reponse_cloudinary.content, content_type=content_type)
        response["Content-Disposition"] = f'inline; filename="{nom_fichier}"'
        return response

    @action(detail=True, methods=["get"], url_path="recu-pdf")
    def recu_pdf(self, request, pk=None):
        """Génère un reçu de paiement PDF officiel, avec entête/pied de
        page BVG — remis au pèlerin comme preuve de versement."""
        paiement = self.get_object()
        html = render_to_string("paiements/recu_paiement.html", {"p": paiement})

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="recu_{paiement.pelerin.numero_id}_{paiement.id}.pdf"'

        resultat = pisa.CreatePDF(html, dest=response, link_callback=link_callback)
        if resultat.err:
            return Response({"erreur": "Échec de la génération du PDF."}, status=500)
        return response

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse

        queryset = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="paiements_export.csv"'

        writer = csv.writer(response)
        writer.writerow(["Date", "N° Dossier", "Pèlerin", "Montant (GNF)", "Mode de paiement", "Référence", "Enregistré par"])

        for p in queryset:
            writer.writerow([
                p.date_paiement,
                p.pelerin.numero_id,
                f"{p.pelerin.prenom} {p.pelerin.nom}",
                p.montant,
                p.get_mode_paiement_display(),
                p.reference or "",
                p.enregistre_par.get_full_name() or p.enregistre_par.username,
            ])

        return response





class ResumeFinancierView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        aujourdhui = date.today()
        debut_mois = aujourdhui.replace(day=1)

        tous_paiements = Paiement.objects.all()
        paiements_du_mois = tous_paiements.filter(date_paiement__gte=debut_mois)

        par_mode = list(
            tous_paiements.values("mode_paiement")
            .annotate(total=Sum("montant"), nombre=Count("id"))
            .order_by("-total")
        )

        return Response({
            "total_general": tous_paiements.aggregate(t=Sum("montant"))["t"] or 0,
            "total_mois_courant": paiements_du_mois.aggregate(t=Sum("montant"))["t"] or 0,
            "nombre_paiements_mois": paiements_du_mois.count(),
            "repartition_par_mode": par_mode,
        })




class SuiviSoldesView(APIView):
    """Vue agrégée : pèlerins classés par statut de conformité paiement
    (complet / à surveiller / en retard) — même logique que le tableau de
    bord Documents, appliquée aux finances."""
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        pelerins = Pelerin.objects.exclude(statut=Pelerin.Statut.CLOTURE).select_related("programme")

        resultat = {"complet": [], "a_surveiller": [], "en_retard": [], "indetermine": []}

        for p in pelerins:
            statut = p.statut_paiement
            if statut == "normal":
                continue  # pas encore concerné, inutile de l'afficher
            resultat.setdefault(statut, []).append({
                "id": p.id,
                "numero_id": p.numero_id,
                "nom_complet": f"{p.prenom} {p.nom}",
                "montant_total_verse": p.montant_total_verse,
                "jours_avant_depart": p.jours_avant_depart,
                "programme": p.programme.nom if p.programme else None,
            })

        return Response(resultat)