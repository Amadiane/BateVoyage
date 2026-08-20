from rest_framework.routers import DefaultRouter
from .views import VolViewSet, GroupeViewSet

router = DefaultRouter()
router.register("vols", VolViewSet, basename="vols")
router.register("groupes", GroupeViewSet, basename="groupes")

urlpatterns = router.urls