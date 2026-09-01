from rest_framework.routers import DefaultRouter
from .views import ProgrammeViewSet, ForfaitViewSet

router = DefaultRouter()
router.register("programmes", ProgrammeViewSet, basename="programmes")
router.register("forfaits", ForfaitViewSet, basename="forfaits")
urlpatterns = router.urls