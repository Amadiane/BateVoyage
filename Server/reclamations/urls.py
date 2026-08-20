from rest_framework.routers import DefaultRouter
from .views import ReclamationViewSet

router = DefaultRouter()
router.register("", ReclamationViewSet, basename="reclamations")
urlpatterns = router.urls
