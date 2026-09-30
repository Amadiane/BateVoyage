from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hebergement", '0004_alter_chambre_type_chambre'),
    ]

    operations = [
        migrations.AddField(
            model_name="hotel",
            name="type_voyage",
            field=models.CharField(
                max_length=15,
                choices=[("pelerinage", "Hajj"), ("oumra", "Oumra")],
                default="pelerinage",
            ),
        ),
        migrations.AddField(
            model_name="campement",
            name="type_voyage",
            field=models.CharField(
                max_length=15,
                choices=[("pelerinage", "Hajj"), ("oumra", "Oumra")],
                default="pelerinage",
            ),
        ),
    ]