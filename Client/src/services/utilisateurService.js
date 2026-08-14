import api from "./api";
import CONFIG from "../config/config";

export const utilisateurService = {
  obtenirProfilConnecte: () => api.get(CONFIG.API_UTILISATEUR_MOI),
  listerComptes: (params) => api.get(CONFIG.API_UTILISATEURS, { params }),
  creerCompte: (donnees) => api.post(CONFIG.API_UTILISATEURS, donnees),
  modifierCompte: (id, donnees) => api.patch(CONFIG.API_UTILISATEUR_DETAIL(id), donnees),
  supprimerCompte: (id) => api.delete(CONFIG.API_UTILISATEUR_DETAIL(id)),
  listerAgentsInscripteurs: () => api.get(CONFIG.API_AGENTS_INSCRIPTEURS),
};