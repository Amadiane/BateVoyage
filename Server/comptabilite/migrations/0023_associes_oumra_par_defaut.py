from django.db import migrations

ASSOCIES_OUMRA = [
    ("Mohamed Ahmed Diallo", 1),
    ("Aboubacar Diallo", 2),
    ("N'famba Ibrahima kaba", 3),
    ("Sekou N'bah koita", 4),
    ("Souleymane Sacko", 5),
    ("Minata Mady kaba", 6),
]


def creer_associes(apps, schema_editor):
    Associe = apps.get_model("comptabilite", "Associe")
    # Si des associés Oumra existent déjà, on ne touche à rien.
    if Associe.objects.filter(activite="oumra").exists():
        return
    for nom, ordre in ASSOCIES_OUMRA:
        Associe.objects.create(
            activite="oumra",
            nom_complet=nom,
            pourcentage_part="0.00",
            est_caisse=False,
            ordre=ordre,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("comptabilite", "0022_associes_hajj_par_defaut"),
    ]

    operations = [
        migrations.RunPython(creer_associes, migrations.RunPython.noop),
    ]