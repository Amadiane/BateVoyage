from rest_framework.routers import DefaultRouter
from .views import VolViewSet, GroupeViewSet, VehiculeViewSet

router = DefaultRouter()
router.register("vols", VolViewSet, basename="vols")
router.register("groupes", GroupeViewSet, basename="groupes")
router.register("vehicules", VehiculeViewSet, basename="vehicules")

urlpatterns = router.urls