import api from "./api";
import CONFIG from "../config/config";

export const decaissementService = {
  listerCategories: (activite) => api.get(CONFIG.API_CATEGORIES_DECAISSEMENT, { params: { activite } }),
  creerCategorie: (donnees) => api.post(CONFIG.API_CATEGORIES_DECAISSEMENT, donnees),
  lister: (params) => api.get(CONFIG.API_DECAISSEMENTS, { params }),
  creer: (donnees) => api.post(CONFIG.API_DECAISSEMENTS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_DECAISSEMENT_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_DECAISSEMENT_DETAIL(id)),
  listerAnneesDisponibles: () => api.get(`${CONFIG.API_DECAISSEMENTS}annees-disponibles/`),
  obtenirRecapitulatif: (activite, annee) => api.get(`${CONFIG.API_DECAISSEMENTS}recapitulatif/`, { params: { activite, annee } }),
  obtenirTauxChange: () => api.get(CONFIG.API_TAUX_CHANGE),
  modifierTauxChange: (donnees) => api.patch(CONFIG.API_TAUX_CHANGE, donnees),
};