from django.db import migrations

MODULES = [
    ("dashboard", "Tableau de bord", True, 1),
    ("hajj", "Hajj", False, 2),
    ("oumra", "Oumra", False, 3),
    ("utilisateurs", "Utilisateurs", False, 4),
    ("documents", "Documents", False, 5),
    ("paiements", "Paiements", False, 6),
    ("programmes", "Programmes", False, 7),
    ("groupes", "Groupes & Vols", False, 8),
    ("hebergement", "Hébergement", False, 9),
    ("reclamations", "Réclamations", False, 10),
    ("comptabilite", "Comptabilité", False, 11),
    ("personnel", "Personnel", False, 12),
    ("modeles_documents", "Modèles de documents", False, 13),
    ("journal", "Journal d'activité", False, 14),
]


def creer_modules(apps, schema_editor):
    ModuleSysteme = apps.get_model("configuration", "ModuleSysteme")
    for cle, nom, actif, ordre in MODULES:
        ModuleSysteme.objects.get_or_create(
            cle=cle, defaults={"nom_affiche": nom, "actif": actif, "ordre": ordre}
        )


class Migration(migrations.Migration):
    dependencies = [("configuration", "0001_initial")]
    operations = [migrations.RunPython(creer_modules, migrations.RunPython.noop)]