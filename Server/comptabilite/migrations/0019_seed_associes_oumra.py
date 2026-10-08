from django.db import migrations

NOMS_OUMRA = [
    "Mohamed Ahmed Diallo",
    "Aboubacar Diallo",
    "N'famba Ibrahima kaba",
    "Sekou N'bah koita",
    "Souleymane Sacko",
    "Minata Mady kaba",
]


def creer_associes_oumra(apps, schema_editor):
    Associe = apps.get_model("comptabilite", "Associe")
    for i, nom in enumerate(NOMS_OUMRA, start=1):
        Associe.objects.get_or_create(
            activite="oumra", nom_complet=nom,
            defaults={"pourcentage_part": 0, "ordre": i},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("comptabilite", "0018_associe_activite_alter_associe_pourcentage_part"),
    ]

    operations = [migrations.RunPython(creer_associes_oumra, migrations.RunPython.noop)]