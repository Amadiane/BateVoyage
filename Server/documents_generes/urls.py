from rest_framework.routers import DefaultRouter
from .views import ModeleDocumentViewSet

router = DefaultRouter()
router.register("modeles", ModeleDocumentViewSet, basename="modeles-documents")
urlpatterns = router.urls