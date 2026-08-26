from django.db import models

# Create your models here.
from django.db import models


class ModuleSysteme(models.Model):
    cle = models.CharField(max_length=50, unique=True, help_text="Doit correspondre exactement à la clé du menu frontend")
    nom_affiche = models.CharField(max_length=100)
    actif = models.BooleanField(default=False)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordre", "nom_affiche"]
        verbose_name = "Module du système"
        verbose_name_plural = "Modules du système"

    def __str__(self):
        return f"{self.nom_affiche} ({'actif' if self.actif else 'masqué'})"