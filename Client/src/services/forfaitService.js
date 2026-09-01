import api from "./api";
import CONFIG from "../config/config";

export const forfaitService = {
  lister: (params) => api.get(CONFIG.API_FORFAITS, { params }),
  obtenir: (id) => api.get(CONFIG.API_FORFAIT_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_FORFAITS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_FORFAIT_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_FORFAIT_DETAIL(id)),
  urlExportPdf: (id) => CONFIG.API_FORFAIT_EXPORT_PDF(id),
};