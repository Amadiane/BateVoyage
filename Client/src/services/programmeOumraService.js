import api from "./api";
import CONFIG from "../config/config";

export const programmeOumraService = {
  lister: (params) => api.get(CONFIG.API_PROGRAMMES, { params: { famille: "oumra", ...params } }),
  creer: (donnees) => api.post(CONFIG.API_PROGRAMMES, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_PROGRAMME_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_PROGRAMME_DETAIL(id)),
  urlPlanningPdf: (id) => `${CONFIG.API_PROGRAMME_DETAIL(id)}planning-pdf/`,
  listerHotels: () => api.get(CONFIG.API_HOTELS),
};