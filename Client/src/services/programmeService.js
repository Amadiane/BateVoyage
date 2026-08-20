import api from "./api";
import CONFIG from "../config/config";

export const programmeService = {
  lister: () => api.get(CONFIG.API_PROGRAMMES),
  obtenir: (id) => api.get(`${CONFIG.API_PROGRAMMES}${id}/`),
  creer: (donnees) => api.post(CONFIG.API_PROGRAMMES, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.API_PROGRAMMES}${id}/`, donnees),
  supprimer: (id) => api.delete(`${CONFIG.API_PROGRAMMES}${id}/`),
};