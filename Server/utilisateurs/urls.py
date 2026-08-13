from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import MeView, UtilisateurViewSet, AgentsInscripteursView

router = DefaultRouter()
router.register("comptes", UtilisateurViewSet, basename="comptes")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("agents-inscripteurs/", AgentsInscripteursView.as_view(), name="agents-inscripteurs"),
    path("", include(router.urls)),
]