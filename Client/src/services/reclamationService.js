import api from "./api";
import CONFIG from "../config/config";

export const reclamationService = {
  lister: (params) => api.get(CONFIG.API_RECLAMATIONS, { params }),
  obtenir: (id) => api.get(CONFIG.API_RECLAMATION_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_RECLAMATIONS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_RECLAMATION_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_RECLAMATION_DETAIL(id)),
};