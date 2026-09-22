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
    CategorieDecaissement, Decaissement, TauxChange, SaisonComptable, ObservationBeneficeGlobal, Dette, Associe, DepensePelerin, Creance, DevisFacture,
)
from .serializers import (
    BonSortieSerializer, DepenseSerializer, DetteFournisseurSerializer,
    CategorieDecaissementSerializer, DecaissementSerializer, TauxChangeSerializer, SaisonComptableSerializer, ObservationBeneficeGlobalSerializer, DetteSerializer, AssocieSerializer, DepensePelerinSerializer, CreanceSerializer, DevisFactureSerializer
)
from .utils import convertir_depuis_gnf, convertir_vers_gnf

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
        annees = Decaissement.objects.dates("date_decaissement", "year")
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

        def calculer_total_categories(activite_cible, saison_cible_id):
            categories = CategorieDecaissement.objects.filter(activite=activite_cible)
            lignes = []
            for cat in categories:
                decaissements_cat = Decaissement.objects.filter(categorie=cat)
                if saison_cible_id:
                    decaissements_cat = decaissements_cat.filter(saison_id=saison_cible_id)
                total_gnf_equiv = sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in decaissements_cat)
                converti = convertir_depuis_gnf(total_gnf_equiv, taux)
                lignes.append({
                    "categorie_id": cat.id,
                    "categorie_nom": cat.nom,
                    "total_gnf": converti["gnf"],
                    "total_usd": converti["usd"],
                    "total_sar": converti["sar"],
                })
            return lignes

        resultats = calculer_total_categories(activite, saison_id)

        # Frais personnels de l'agence — fusionnés dans le total global de
        # Décaissement Hajj/Oumra, indépendamment de la saison Hajj/Oumra
        # sélectionnée (les frais personnels suivent leur propre saison active).
        resultats_personnel = []
        if activite in ("hajj", "oumra"):
            saison_personnel = SaisonComptable.objects.filter(activite="personnel", est_active=True).first()
            if saison_personnel:
                resultats_personnel = calculer_total_categories("personnel", saison_personnel.id)

        total_general_gnf = sum(l["total_gnf"] for l in resultats) + sum(l["total_gnf"] for l in resultats_personnel)
        total_general_converti = convertir_depuis_gnf(total_general_gnf, taux)

        return Response({
            "taux": TauxChangeSerializer(taux).data,
            "categories": resultats,
            "categories_personnel": resultats_personnel,
            "total_general": total_general_converti,
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
                total_encaisse = float(
                    Paiement.objects.filter(pelerin__type_voyage=type_voyage).aggregate(t=Sum("montant"))["t"] or 0
                )
                avertissement_encaisse = "Aucun paiement rattaché à cette saison — total affiché = tous les paiements enregistrés pour cette activité."
        else:
            total_encaisse = float(Paiement.objects.filter(pelerin__type_voyage=type_voyage).aggregate(t=Sum("montant"))["t"] or 0)

        # --- Total décaissé (uniquement les Décaissements de la saison sélectionnée) ---
        # Initialisé à 0 AVANT le if : évite le NameError si aucune saison n'est passée.
        total_decaisse = 0.0
        decaissements_saison = Decaissement.objects.filter(activite=activite)
        if saison_id:
            decaissements_saison = decaissements_saison.filter(saison_id=saison_id)
        total_decaisse = sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in decaissements_saison)

        # --- Créances / Dettes ---
        total_creance = float(BonSortie.objects.filter(activite=activite, justifie=False).aggregate(t=Sum("montant"))["t"] or 0)
        total_dette = float(DetteFournisseur.objects.filter(activite=activite, soldee=False).aggregate(t=Sum("montant_du"))["t"] or 0)

        benefice_provisoire = total_encaisse - total_decaisse
        difference = total_creance - total_dette
        benefice_reel = benefice_provisoire - difference

        def convertir(montant_gnf):
            return convertir_depuis_gnf(montant_gnf, taux)

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


class DetteViewSet(viewsets.ModelViewSet):
    queryset = Dette.objects.select_related("associe", "enregistre_par").all()
    serializer_class = DetteSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["soldee", "associe", "devise"]
    search_fields = ["nom", "prenom"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()


class AssocieViewSet(viewsets.ModelViewSet):
    queryset = Associe.objects.all()
    serializer_class = AssocieSerializer
    permission_classes = [EstGestionnaireFinancier]


class BeneficeIndividuelView(APIView):
    permission_classes = [EstGestionnaireFinancier]

    def get(self, request):
        activite = request.query_params.get("activite", "hajj")
        saison_id = request.query_params.get("saison")
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})

        from paiements.models import Paiement
        type_voyage = "pelerinage" if activite == "hajj" else "oumra"

        if saison_id:
            paiements_saison = Paiement.objects.filter(saison_id=saison_id)
            total_encaisse = float(
                (paiements_saison if paiements_saison.exists() else Paiement.objects.filter(pelerin__type_voyage=type_voyage))
                .aggregate(t=Sum("montant"))["t"] or 0
            )
        else:
            total_encaisse = float(Paiement.objects.filter(pelerin__type_voyage=type_voyage).aggregate(t=Sum("montant"))["t"] or 0)

        # Initialisé à 0 AVANT le if : même correctif que BeneficeGlobalView.
        total_decaisse = 0.0
        decaissements_saison = Decaissement.objects.filter(activite=activite)
        if saison_id:
            decaissements_saison = decaissements_saison.filter(saison_id=saison_id)
        total_decaisse = sum(convertir_vers_gnf(d.montant, d.devise, taux) for d in decaissements_saison)

        total_creance = float(BonSortie.objects.filter(activite=activite, justifie=False).aggregate(t=Sum("montant"))["t"] or 0)
        total_dette_fournisseur = float(DetteFournisseur.objects.filter(activite=activite, soldee=False).aggregate(t=Sum("montant_du"))["t"] or 0)

        benefice_provisoire = total_encaisse - total_decaisse
        difference = total_creance - total_dette_fournisseur
        benefice_reel = benefice_provisoire - difference

        def convertir(montant_gnf):
            return convertir_depuis_gnf(montant_gnf, taux)

        associes = Associe.objects.all().order_by("ordre")
        resultats = []
        for a in associes:
            part_benefice_gnf = benefice_reel * (float(a.pourcentage_part) / 100)

            if a.est_caisse:
                resultats.append({
                    "associe_id": a.id,
                    "nom": a.nom_complet,
                    "pourcentage": float(a.pourcentage_part),
                    "lignes": [
                        {"designation": f"{a.pourcentage_part}% du Bénéfice global", "valeurs": convertir(part_benefice_gnf)},
                    ],
                })
                continue

            total_dettes_associe_gnf = sum(
                convertir_vers_gnf(dette.montant, dette.devise, taux)
                for dette in Dette.objects.filter(associe=a, soldee=False)
            )

            difference_dette_benefice = total_dettes_associe_gnf - part_benefice_gnf
            benefice_net_individuel = part_benefice_gnf - total_dettes_associe_gnf

            resultats.append({
                "associe_id": a.id,
                "nom": a.nom_complet,
                "pourcentage": float(a.pourcentage_part),
                "lignes": [
                    {"designation": f"{a.pourcentage_part}% du Bénéfice global", "valeurs": convertir(part_benefice_gnf)},
                    {"designation": "Total de ses dettes", "valeurs": convertir(total_dettes_associe_gnf)},
                    {"designation": "Différence entre Dette et Bénéfice", "valeurs": convertir(difference_dette_benefice)},
                    {"designation": "Bénéfice net individuel", "valeurs": convertir(benefice_net_individuel)},
                ],
            })

        return Response({
            "benefice_reel_global": convertir(benefice_reel),
            "associes": resultats,
        })


class DepensePelerinViewSet(viewsets.ModelViewSet):
    queryset = DepensePelerin.objects.select_related("pelerin").all()
    serializer_class = DepensePelerinSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["pelerin", "categorie"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=False, methods=["get"], url_path="recapitulatif-pelerin")
    def recapitulatif_pelerin(self, request):
        from pelerins.models import Pelerin
        pelerin_id = request.query_params.get("pelerin")
        if not pelerin_id:
            return Response({"erreur": "Pèlerin requis."}, status=400)

        pelerin = Pelerin.objects.get(id=pelerin_id)
        taux, _ = TauxChange.objects.get_or_create(id=1, defaults={"taux_usd": 8600, "taux_sar": 2300})

        depenses = DepensePelerin.objects.filter(pelerin=pelerin)

        totaux_categorie = {}
        for cle, label in DepensePelerin.Categorie.choices:
            totaux_categorie[cle] = {"label": label, "gnf": 0.0}

        for d in depenses:
            totaux_categorie[d.categorie]["gnf"] += convertir_vers_gnf(d.montant, d.devise, taux)

        def convertir(montant_gnf):
            return convertir_depuis_gnf(montant_gnf, taux)

        lignes = [{"designation": v["label"], "valeurs": convertir(v["gnf"])} for v in totaux_categorie.values()]
        total_depense = sum(v["gnf"] for v in totaux_categorie.values())
        total_versement = float(pelerin.montant_total_verse or 0)
        benefice = total_versement - total_depense

        lignes.append({"designation": "TOTAL DÉPENSE PÈLERIN", "valeurs": convertir(total_depense), "gras": True})
        lignes.append({"designation": "TOTAL VERSEMENTS PÈLERIN", "valeurs": convertir(total_versement), "gras": True})
        lignes.append({"designation": "BÉNÉFICE PAR PÈLERIN", "valeurs": convertir(benefice), "gras": True})

        return Response({"lignes": lignes})


class CreanceViewSet(viewsets.ModelViewSet):
    queryset = Creance.objects.select_related("enregistre_par").all()
    serializer_class = CreanceSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["soldee", "devise"]
    search_fields = ["nom", "prenom"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()


class DevisFactureViewSet(viewsets.ModelViewSet):
    queryset = DevisFacture.objects.select_related("pelerin", "enregistre_par").all()
    serializer_class = DevisFactureSerializer
    permission_classes = [EstGestionnaireFinancier]
    filterset_fields = ["type_document", "paye", "devise"]

    def perform_create(self, serializer):
        with set_actor(self.request.user):
            serializer.save(enregistre_par=self.request.user)

    def perform_update(self, serializer):
        with set_actor(self.request.user):
            serializer.save()

    def perform_destroy(self, instance):
        with set_actor(self.request.user):
            instance.delete()

    @action(detail=False, methods=["get"], url_path="impayes")
    def impayes(self, request):
        impayes = self.get_queryset().filter(type_document__in=["facture", "devis"], paye=False)
        serializer = self.get_serializer(impayes, many=True)
        total = sum(float(d.montant) for d in impayes)
        return Response({"documents": serializer.data, "total_impaye": total})