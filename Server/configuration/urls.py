from rest_framework.routers import DefaultRouter
from .views import ModuleSystemeViewSet

router = DefaultRouter()
router.register("", ModuleSystemeViewSet, basename="modules-systeme")
urlpatterns = router.urls