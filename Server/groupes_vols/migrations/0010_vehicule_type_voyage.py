from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("groupes_vols", "0004_vol_groupe_type_voyage"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehicule",
            name="type_voyage",
            field=models.CharField(
                max_length=15,
                choices=[("pelerinage", "Hajj"), ("oumra", "Oumra")],
                default="pelerinage",
            ),
        ),
    ]