from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BonSortieViewSet, DepenseViewSet, DetteFournisseurViewSet, ResumeComptabiliteView,
    CategorieDecaissementViewSet, DecaissementViewSet, TauxChangeView, SaisonComptableViewSet,
)

router = DefaultRouter()
router.register("bons-sortie", BonSortieViewSet, basename="bons-sortie")
router.register("depenses", DepenseViewSet, basename="depenses")
router.register("dettes-fournisseurs", DetteFournisseurViewSet, basename="dettes-fournisseurs")
router.register("categories-decaissement", CategorieDecaissementViewSet, basename="categories-decaissement")
router.register("decaissements", DecaissementViewSet, basename="decaissements")
router.register("saisons", SaisonComptableViewSet, basename="saisons")

urlpatterns = [
    path("resume/", ResumeComptabiliteView.as_view(), name="resume-comptabilite"),
    path("taux-change/", TauxChangeView.as_view(), name="taux-change"),
    path("", include(router.urls)),
]