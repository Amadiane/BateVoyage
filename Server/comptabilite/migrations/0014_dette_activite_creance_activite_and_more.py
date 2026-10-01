from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("comptabilite", "0013_devisfacture_activite_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="dette",
            name="activite",
            field=models.CharField(
                choices=[("hajj", "Hajj"), ("oumra", "Oumra")],
                default="hajj",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="creance",
            name="activite",
            field=models.CharField(
                choices=[("hajj", "Hajj"), ("oumra", "Oumra")],
                default="hajj",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="depensepelerin",
            name="activite",
            field=models.CharField(
                choices=[("hajj", "Hajj"), ("oumra", "Oumra")],
                default="hajj",
                max_length=10,
            ),
        ),
    ]