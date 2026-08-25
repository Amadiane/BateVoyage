from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BonSortieViewSet, DepenseViewSet, DetteFournisseurViewSet, ResumeComptabiliteView

router = DefaultRouter()
router.register("bons-sortie", BonSortieViewSet, basename="bons-sortie")
router.register("depenses", DepenseViewSet, basename="depenses")
router.register("dettes-fournisseurs", DetteFournisseurViewSet, basename="dettes-fournisseurs")

urlpatterns = [
    path("resume/", ResumeComptabiliteView.as_view(), name="resume-comptabilite"),
    path("", include(router.urls)),
]