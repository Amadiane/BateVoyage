from rest_framework.permissions import BasePermission

class EstFondateurOuAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "fondateur", "admin_general"
        ]

class EstComptableOuPlus(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "fondateur", "admin_general", "comptable"
        ]

class EstEncadrementTerrain(BasePermission):
    """Guide, Encadreur, Mounazim, Docteur, Traducteur — accès au suivi terrain."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "guide", "encadreur", "mounazim", "docteur", "traducteur",
            "fondateur", "admin_general",
        ]

class EstPelerin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "pelerin"

class EstGestionnaireFinancier(BasePermission):
    """Fondateur, Admin Général, Comptable, Secrétaire — les seuls
    habilités à créer/modifier/supprimer des paiements."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "fondateur", "admin_general", "comptable", "secretaire",
        ]