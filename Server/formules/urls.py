from rest_framework.routers import DefaultRouter
from .views import ProgrammeViewSet

router = DefaultRouter()
router.register("programmes", ProgrammeViewSet, basename="programmes")
urlpatterns = router.urls