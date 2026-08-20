import api from "./api";
import CONFIG from "../config/config";

export const volService = {
  lister: () => api.get(CONFIG.API_VOLS),
  creer: (donnees) => api.post(CONFIG.API_VOLS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_VOL_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_VOL_DETAIL(id)),
};