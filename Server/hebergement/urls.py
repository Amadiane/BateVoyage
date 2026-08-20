from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, ChambreViewSet

router = DefaultRouter()
router.register("hotels", HotelViewSet, basename="hotels")
router.register("chambres", ChambreViewSet, basename="chambres")

urlpatterns = router.urls