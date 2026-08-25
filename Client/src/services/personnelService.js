import api from "./api";
import CONFIG from "../config/config";

export const personnelService = {
  lister: (params) => api.get(CONFIG.API_PERSONNEL, { params }),
  obtenir: (id) => api.get(CONFIG.API_PERSONNEL_DETAIL(id)),
  creer: (formData) => api.post(CONFIG.API_PERSONNEL, formData),
  modifier: (id, formData) => api.patch(CONFIG.API_PERSONNEL_DETAIL(id), formData),
  supprimer: (id) => api.delete(CONFIG.API_PERSONNEL_DETAIL(id)),
};