from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BonSortieViewSet, DepenseViewSet, DetteFournisseurViewSet, ResumeComptabiliteView,
    CategorieDecaissementViewSet, DecaissementViewSet, TauxChangeView,
    SaisonComptableViewSet, EncaissementView, BeneficeGlobalView,
    DetteViewSet, AssocieViewSet, BeneficeIndividuelView, DepensePelerinViewSet,
    CreanceViewSet, DevisFactureViewSet, LigneBudgetFonctionnementViewSet
)

router = DefaultRouter()
router.register("bons-sortie", BonSortieViewSet, basename="bons-sortie")
router.register("depenses", DepenseViewSet, basename="depenses")
router.register("dettes-fournisseurs", DetteFournisseurViewSet, basename="dettes-fournisseurs")
router.register("categories-decaissement", CategorieDecaissementViewSet, basename="categories-decaissement")
router.register("decaissements", DecaissementViewSet, basename="decaissements")
router.register("saisons", SaisonComptableViewSet, basename="saisons")
router.register("dettes", DetteViewSet, basename="dettes")
router.register("associes", AssocieViewSet, basename="associes")
router.register("depenses-pelerin", DepensePelerinViewSet, basename="depenses-pelerin")
router.register("creances", CreanceViewSet, basename="creances")
router.register("devis-factures", DevisFactureViewSet, basename="devis-factures")
router.register("budget-fonctionnement", LigneBudgetFonctionnementViewSet, basename="budget-fonctionnement")

urlpatterns = [
    path("resume/", ResumeComptabiliteView.as_view(), name="resume-comptabilite"),
    path("taux-change/", TauxChangeView.as_view(), name="taux-change"),
    path("encaissements/", EncaissementView.as_view(), name="encaissements"),
    path("benefice-global/", BeneficeGlobalView.as_view(), name="benefice-global"),
    path("benefice-individuel/", BeneficeIndividuelView.as_view(), name="benefice-individuel"),
    path("", include(router.urls)),
]