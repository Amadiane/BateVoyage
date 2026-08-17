from django.urls import path
from .views import JournalGlobalView

urlpatterns = [
    path("global/", JournalGlobalView.as_view(), name="journal-global"),
]