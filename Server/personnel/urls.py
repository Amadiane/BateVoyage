from rest_framework.routers import DefaultRouter
from .views import FichePersonnelViewSet

router = DefaultRouter()
router.register("", FichePersonnelViewSet, basename="personnel")
urlpatterns = router.urls