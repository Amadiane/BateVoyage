from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import MeView, UtilisateurViewSet

router = DefaultRouter()
router.register("comptes", UtilisateurViewSet, basename="comptes")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]