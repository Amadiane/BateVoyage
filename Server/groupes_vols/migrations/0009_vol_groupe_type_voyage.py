from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("groupes_vols", "0008_vehicule_groupe_lie"),
    ]

    operations = [
        migrations.AddField(
            model_name="vol",
            name="type_voyage",
            field=models.CharField(
                max_length=15,
                choices=[("pelerinage", "Hajj"), ("oumra", "Oumra")],
                default="pelerinage",
            ),
        ),
        migrations.AddField(
            model_name="groupe",
            name="type_voyage",
            field=models.CharField(
                max_length=15,
                choices=[("pelerinage", "Hajj"), ("oumra", "Oumra")],
                default="pelerinage",
            ),
        ),
    ]
