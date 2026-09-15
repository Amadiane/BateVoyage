import django_filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from auditlog.context import set_actor
from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from activite.serializers import EntreeJournalDetailSerializer
from utilisateurs.permissions import EstGestionnaireFinancier
from django.db.models import Sum
from .models import (
    BonSortie, Depense, DetteFournisseur,
    CategorieDecaissement, Decaissement, TauxChange, SaisonComptable, ObservationBeneficeGlobal,
)
from .serializers import (
    BonSortieSerializer, DepenseSerializer, DetteFournisseurSerializer,
    CategorieDecaissementSerializer, DecaissementSerializer, TauxChangeSerializer, SaisonComptableSerializer, ObservationBeneficeGlobalSerializer,
)


class BonSortieViewSet(viewsets.ModelViewSet):
    queryset = BonSortie.objects.select_related("enregistre_par", "beneficiaire_utilisateur").all()
    serializer_class = BonSortieSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["justifie", "activite"]
    search_fields = ["beneficiaire_nom", "motif", "numero_bon"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()


class DepenseViewSet(viewsets.ModelViewSet):
    queryset = Depense.objects.select_related("enregistre_par").all()
    serializer_class = DepenseSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["categorie", "activite"]
    search_fields = ["description"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()


class DetteFournisseurViewSet(viewsets.ModelViewSet):
    queryset = DetteFournisseur.objects.select_related("enregistre_par").all()
    serializer_class = DetteFournisseurSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["soldee", "activite"]
    search_fields = ["nom_fournisseur", "motif"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()


class ResumeComptabiliteView(APIView):
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        activite = request.query_params.get("activite")
        filtre = {"activite": activite} if activite else {}

        creances_non_justifiees = BonSortie.objects.filter(justifie=False, **filtre)
        depenses = Depense.objects.filter(**filtre)
        dettes_non_soldees = DetteFournisseur.objects.filter(soldee=False, **filtre)

        return Response({
            "total_creances_en_attente": creances_non_justifiees.aggregate(t=Sum("montant"))["t"] or 0,
            "nombre_creances_en_attente": creances_non_justifiees.count(),
            "total_depenses": depenses.aggregate(t=Sum("montant"))["t"] or 0,
            "total_dettes_fournisseurs": dettes_non_soldees.aggregate(t=Sum("montant_du"))["t"] or 0,
            "nombre_dettes_fournisseurs": dettes_non_soldees.count(),
        })


class CategorieDecaissementViewSet(viewsets.ModelViewSet):
    queryset = CategorieDecaissement.objects.all()
    serializer_class = CategorieDecaissementSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["activite"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(est_categorie_fixe=False)


class DecaissementFilter(django_filters.FilterSet):
    class Meta:
        model = Decaissement
        fields = ["activite", "categorie", "devise", "saison"]


class DecaissementViewSet(viewsets.ModelViewSet):
    queryset = Decaissement.objects.select_related("categorie", "pelerin", "enregistre_par").all()
    serializer_class = DecaissementSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_class = DecaissementFilter

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=False, methods=["get"], url_path="annees-disponibles")
    def annees_disponibles(self, request):
        annees = (
            Decaissement.objects
            .dates("date_decaissement", "year")
        )
        liste = sorted({d.year for d in annees}, reverse=True)
        from django.utils import timezone
        annee_courante = timezone.now().year
        if annee_courante not in liste:
            liste.insert(0, annee_courante)
        return Response(liste)

    @action(detail=False, methods=["get"], url_path="recapitulatif")
    def recapitulatif(self, request):
        activite = request.query_params.get("activite", "hajj")
        saison_id = request.query_params.get("saison")
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})

        categories = CategorieDecaissement.objects.filter(activite=activite)
        resultats = []
        for cat in categories:
            decaissements_cat = Decaissement.objects.filter(categorie=cat)
            if saison_id:
                decaissements_cat = decaissements_cat.filter(saison_id=saison_id)
            else:
                decaissements_cat = decaissements_cat.none()  # aucune saison sélectionnée = rien à afficher

            total_gnf_equiv = 0
            for d in decaissements_cat:
                montant = float(d.montant)
                if d.devise == "GNF":
                    total_gnf_equiv += montant
                elif d.devise == "USD":
                    total_gnf_equiv += montant * float(taux.taux_usd)
                elif d.devise == "SAR":
                    total_gnf_equiv += montant * float(taux.taux_sar)

            resultats.append({
                "categorie_id": cat.id,
                "categorie_nom": cat.nom,
                "total_gnf": round(total_gnf_equiv, 2),
                "total_usd": round(total_gnf_equiv / float(taux.taux_usd), 2) if taux.taux_usd else 0,
                "total_sar": round(total_gnf_equiv / float(taux.taux_sar), 2) if taux.taux_sar else 0,
            })
        return Response({"taux": TauxChangeSerializer(taux).data, "categories": resultats})

class TauxChangeView(APIView):
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})
        return Response(TauxChangeSerializer(taux).data)

    def patch(self, request):
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})
        serializer = TauxChangeSerializer(taux, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class SaisonComptableViewSet(viewsets.ModelViewSet):
    queryset = SaisonComptable.objects.all()
    serializer_class = SaisonComptableSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["activite"]

class SaisonComptableViewSet(viewsets.ModelViewSet):
    queryset = SaisonComptable.objects.all()
    serializer_class = SaisonComptableSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["activite"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

class EncaissementView(APIView):
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        from paiements.models import Paiement
        from pelerins.models import Pelerin

        activite = request.query_params.get("activite", "hajj")
        type_voyage = "pelerinage" if activite == "hajj" else "oumra"

        paiements = Paiement.objects.filter(
            pelerin__type_voyage=type_voyage
        ).select_related("pelerin").order_by("-date_paiement")

        resultats = [{
            "id": p.id,
            "numero_recu": p.numero_recu,
            "pelerin_nom": f"{p.pelerin.prenom} {p.pelerin.nom}",
            "pelerin_numero_id": p.pelerin.numero_id,
            "montant": p.montant,
            "mode_paiement_display": p.get_mode_paiement_display(),
            "date_paiement": p.date_paiement,
        } for p in paiements]

        total = sum(float(p.montant) for p in paiements)

        return Response({"paiements": resultats, "total": total})


class BeneficeGlobalView(APIView):
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        from paiements.models import Paiement
        from pelerins.models import Pelerin

        activite = request.query_params.get("activite", "hajj")
        saison_id = request.query_params.get("saison")
        type_voyage = "pelerinage" if activite == "hajj" else "oumra"
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})

        # --- Total encaissé ---
        avertissement_encaisse = None
        if saison_id:
            paiements_saison = Paiement.objects.filter(saison_id=saison_id)
            if paiements_saison.exists():
                total_encaisse = float(paiements_saison.aggregate(t=Sum("montant"))["t"] or 0)
            else:
                # Aucun paiement encore rattaché à cette saison précise —
                # on retombe sur l'ensemble des paiements du type de voyage,
                # en le signalant clairement au client.
                total_encaisse = float(
                    Paiement.objects.filter(pelerin__type_voyage=type_voyage).aggregate(t=Sum("montant"))["t"] or 0
                )
                avertissement_encaisse = "Aucun paiement rattaché à cette saison — total affiché = tous les paiements enregistrés pour cette activité."
        else:
            total_encaisse = float(Paiement.objects.filter(pelerin__type_voyage=type_voyage).aggregate(t=Sum("montant"))["t"] or 0)

        # --- Total décaissé (uniquement les Décaissements de la saison sélectionnée) ---
        decaissements_saison = Decaissement.objects.filter(activite=activite)
        if saison_id:
            decaissements_saison = decaissements_saison.filter(saison_id=saison_id)
        total_decaisse = 0
        for d in decaissements_saison:
            montant = float(d.montant)
            if d.devise == "USD":
                montant *= float(taux.taux_usd)
            elif d.devise == "SAR":
                montant *= float(taux.taux_sar)
            total_decaisse += montant

        # --- Créances / Dettes (Bons de sortie / Dettes fournisseurs, par activité) ---
        total_creance = float(BonSortie.objects.filter(activite=activite, justifie=False).aggregate(t=Sum("montant"))["t"] or 0)
        total_dette = float(DetteFournisseur.objects.filter(activite=activite, soldee=False).aggregate(t=Sum("montant_du"))["t"] or 0)

        benefice_provisoire = total_encaisse - total_decaisse
        difference = total_creance - total_dette
        benefice_reel = benefice_provisoire - difference

        def convertir(montant_gnf):
            return {
                "gnf": round(montant_gnf, 2),
                "usd": round(montant_gnf / float(taux.taux_usd), 2) if taux.taux_usd else 0,
                "sar": round(montant_gnf / float(taux.taux_sar), 2) if taux.taux_sar else 0,
            }

        observation = ""
        if saison_id:
            obs = ObservationBeneficeGlobal.objects.filter(saison_id=saison_id).first()
            observation = obs.texte if obs else ""

        return Response({
            "lignes": [
                {"designation": "Total encaissé", "cle": "total_encaisse", "valeurs": convertir(total_encaisse), "avertissement": avertissement_encaisse},
                {"designation": "Total décaissé", "cle": "total_decaisse", "valeurs": convertir(total_decaisse), "avertissement": "Inclut uniquement les Décaissements de la saison sélectionnée."},
                {"designation": "Bénéfice provisoire", "cle": "benefice_provisoire", "valeurs": convertir(benefice_provisoire)},
                {"designation": "Total créances", "cle": "total_creance", "valeurs": convertir(total_creance), "avertissement": "Bons de sortie non justifiés, toutes saisons confondues pour cette activité."},
                {"designation": "Total dettes", "cle": "total_dette", "valeurs": convertir(total_dette), "avertissement": "Dettes fournisseurs non soldées, toutes saisons confondues pour cette activité."},
                {"designation": "Différence", "cle": "difference", "valeurs": convertir(difference)},
                {"designation": "BÉNÉFICE RÉEL", "cle": "benefice_reel", "valeurs": convertir(benefice_reel)},
            ],
            "observation": observation,
        })

    def patch(self, request):
        saison_id = request.data.get("saison")
        texte = request.data.get("observation", "")
        if not saison_id:
            return Response({"erreur": "Saison requise."}, status=400)
        obs, _ = ObservationBeneficeGlobal.objects.get_or_create(saison_id=saison_id)
        obs.texte = texte
        obs.save()
        return Response({"detail": "Observation enregistrée."})