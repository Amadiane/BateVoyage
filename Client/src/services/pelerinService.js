import api from "./api";
import CONFIG from "../config/config";

export const pelerinService = {
  lister: (params) => api.get(CONFIG.API_PELERINS, { params }),
  obtenir: (id) => api.get(CONFIG.API_PELERIN_DETAIL(id)),
  creer: (formData) => api.post(CONFIG.API_PELERINS, formData),
  modifier: (id, formData) => api.patch(CONFIG.API_PELERIN_DETAIL(id), formData),
  supprimer: (id) => api.delete(CONFIG.API_PELERIN_DETAIL(id)),
  urlFichePdf: (id) => CONFIG.API_PELERIN_FICHE_PDF(id),
  obtenirHistorique: (id) => api.get(CONFIG.API_PELERIN_HISTORIQUE(id)),
};