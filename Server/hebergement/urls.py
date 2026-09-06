from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, ChambreViewSet, VilleViewSet, CampementViewSet

router = DefaultRouter()
router.register("villes", VilleViewSet, basename="villes")
router.register("hotels", HotelViewSet, basename="hotels")
router.register("chambres", ChambreViewSet, basename="chambres")
router.register("campements", CampementViewSet, basename="campements")
urlpatterns = router.urls