import api from "./api";
import CONFIG from "../config/config";

export const utilisateurService = {
  obtenirProfilConnecte: () => api.get(CONFIG.API_UTILISATEUR_MOI),
  listerComptes: (params) => api.get(CONFIG.API_UTILISATEURS, { params }),
  obtenirCompte: (id) => api.get(CONFIG.API_UTILISATEUR_DETAIL(id)),
  creerCompte: (formData) => api.post(CONFIG.API_UTILISATEURS, formData),
  modifierCompte: (id, formData) => api.patch(CONFIG.API_UTILISATEUR_DETAIL(id), formData),
  supprimerCompte: (id) => api.delete(CONFIG.API_UTILISATEUR_DETAIL(id)),
  listerAgentsInscripteurs: () => api.get(CONFIG.API_AGENTS_INSCRIPTEURS),
  modifierMotDePasse: (id, nouveauMotDePasse) =>
    api.post(CONFIG.API_UTILISATEUR_MOT_DE_PASSE(id), { nouveau_mot_de_passe: nouveauMotDePasse }),
  obtenirHistorique: (id) => api.get(CONFIG.API_UTILISATEUR_HISTORIQUE(id)),
};