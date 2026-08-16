from django.urls import path
from .views import TableauBordDocumentsView

urlpatterns = [
    path("tableau-bord/", TableauBordDocumentsView.as_view(), name="documents-tableau-bord"),
]