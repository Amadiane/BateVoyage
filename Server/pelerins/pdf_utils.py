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


def envelopper_avec_entete_pied(corps_html, style_supplementaire=""):
    """Enveloppe un fragment HTML avec l'en-tête et le pied de page officiels
    BVG, étalés sur toute la largeur de la page (bord à bord, sans marge).
    Les dimensions sont fixées en cm (xhtml2pdf ne calcule pas toujours
    correctement les largeurs en pourcentage sur les balises <img>)."""
    return f"""
    <html>
    <head>
    <style>
      @page {{
        size: A4;
        margin-top: 6.3cm; margin-bottom: 3.6cm; margin-left: 1.5cm; margin-right: 1.5cm;
        @frame header_frame {{ -pdf-frame-content: header_content; top: 0cm; left: 0cm; right: 0cm; height: 5.93cm; }}
        @frame footer_frame {{ -pdf-frame-content: footer_content; bottom: 0cm; left: 0cm; right: 0cm; height: 3.22cm; }}
      }}
      body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1F2937; line-height: 1.6; }}
      #header_content, #footer_content {{ margin: 0; padding: 0; }}
      #header_content img {{ width: 21cm; height: 5.93cm; display: block; margin: 0; padding: 0; }}
      #footer_content img {{ width: 21cm; height: 3.22cm; display: block; margin: 0; padding: 0; }}
      .titre-doc {{ font-size: 16px; font-weight: bold; color: #0B3FA0; text-align: center; margin: 8px 0 4px; }}
      .ligne-separation {{ border-bottom: 2px solid #0B3FA0; margin: 4px 0 20px; }}
      table.champs {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
      table.champs td {{ padding: 7px 4px; border-bottom: 1px solid #F0F1F3; font-size: 11.5px; }}
      table.champs td.label {{ width: 35%; font-weight: bold; color: #4B5563; }}
      table.champs td.valeur {{ width: 65%; color: #111827; }}
      {style_supplementaire}
    </style>
    </head>
    <body>
      <div id="header_content"><img src="/static/pelerins/entete_bvg.png" /></div>
      <div id="footer_content"><img src="/static/pelerins/pied_bvg.png" /></div>
      {corps_html}
    </body>
    </html>
    """