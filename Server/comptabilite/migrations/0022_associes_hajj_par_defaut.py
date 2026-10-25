from django.db import migrations

ASSOCIES_HAJJ = [
    ("N'FAMBA IBRAHIMA KABA", "30.00", False, 1),
    ("Mohamed Ahmad Diallo", "30.00", False, 2),
    ("Aboubacar Ahmad Diallo", "30.00", False, 3),
    ("La caisse", "10.00", True, 4),
]


def creer_associes(apps, schema_editor):
    Associe = apps.get_model("comptabilite", "Associe")
    # Si des associés Hajj existent déjà (saisis en ligne), on ne touche à rien.
    if Associe.objects.filter(activite="hajj").exists():
        return
    for nom, pourcentage, est_caisse, ordre in ASSOCIES_HAJJ:
        Associe.objects.create(
            activite="hajj",
            nom_complet=nom,
            pourcentage_part=pourcentage,
            est_caisse=est_caisse,
            ordre=ordre,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("comptabilite", "0021_categories_decaissement_par_defaut"),
    ]

    operations = [
        migrations.RunPython(creer_associes, migrations.RunPython.noop),
    ]