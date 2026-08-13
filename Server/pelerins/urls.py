# urls.py
from rest_framework.routers import DefaultRouter
from .views import PelerinViewSet

router = DefaultRouter()
router.register("", PelerinViewSet, basename="pelerins")
urlpatterns = router.urls