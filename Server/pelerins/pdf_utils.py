import os
from django.conf import settings
from django.contrib.staticfiles import finders


def link_callback(uri, rel):
    """xhtml2pdf ne sait pas récupérer les fichiers via une URL Django —
    cette fonction convertit /static/... en chemin réel sur le disque."""
    if uri.startswith(settings.STATIC_URL):
        chemin_relatif = uri.replace(settings.STATIC_URL, "")
        resultat = finders.find(chemin_relatif)
        if resultat:
            return resultat

    if hasattr(settings, "MEDIA_URL") and uri.startswith(settings.MEDIA_URL) and hasattr(settings, "MEDIA_ROOT"):
        chemin = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        if os.path.isfile(chemin):
            return chemin

    # Laisse passer les URLs externes telles quelles (ex: photo Cloudinary)
    return uri