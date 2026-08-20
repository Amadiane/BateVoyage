from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementViewSet, ResumeFinancierView, SuiviSoldesView

router = DefaultRouter()
router.register("", PaiementViewSet, basename="paiements")

urlpatterns = [
    path("resume-financier/", ResumeFinancierView.as_view(), name="resume-financier"),
    path("suivi-soldes/", SuiviSoldesView.as_view(), name="suivi-soldes"),
    path("", include(router.urls)),
]