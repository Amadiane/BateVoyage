from django.shortcuts import render

# Create your views here.
from django.db.models import Sum
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from auditlog.context import set_actor
from utilisateurs.permissions import EstGestionnaireFinancier
from .models import BonSortie, Depense, DetteFournisseur
from .serializers import BonSortieSerializer, DepenseSerializer, DetteFournisseurSerializer
from django.contrib.contenttypes.models import ContentType
from auditlog.models import LogEntry
from activite.serializers import EntreeJournalDetailSerializer
from rest_framework.decorators import action
from rest_framework.response import Response


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
    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        instance = self.get_object()
        content_type = ContentType.objects.get_for_model(instance.__class__)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(instance.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)




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
    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        instance = self.get_object()
        content_type = ContentType.objects.get_for_model(instance.__class__)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(instance.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)


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
    @action(detail=True, methods=["get"], url_path="historique")
    def historique(self, request, pk=None):
        instance = self.get_object()
        content_type = ContentType.objects.get_for_model(instance.__class__)
        entrees = LogEntry.objects.filter(
            content_type=content_type, object_pk=str(instance.pk)
        ).select_related("actor").order_by("-timestamp")
        serializer = EntreeJournalDetailSerializer(entrees, many=True)
        return Response(serializer.data)


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