import api from "./api";
import CONFIG from "../config/config";

export const villeService = {
  lister: () => api.get(CONFIG.API_VILLES),
  creer: (donnees) => api.post(CONFIG.API_VILLES, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_VILLE_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_VILLE_DETAIL(id)),
};