from rest_framework.permissions import BasePermission
from rest_framework.permissions import SAFE_METHODS

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




class EstGestionnaireLogistique(BasePermission):
    """Lecture ouverte à tout connecté (utile aux guides/encadreurs sur
    le terrain), écriture réservée à l'équipe administrative."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["fondateur", "admin_general", "secretaire"]


class EstGestionnaireReclamations(BasePermission):
    """Fondateur, Admin Général, Affaires sociales — habilités à gérer
    les réclamations. Les autres rôles authentifiés ne peuvent que
    consulter (utile aux agents qui créent une réclamation pour un pèlerin)."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["fondateur", "admin_general", "affaires_sociales"]