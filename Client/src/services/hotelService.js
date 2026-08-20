import api from "./api";
import CONFIG from "../config/config";

export const hotelService = {
  lister: () => api.get(CONFIG.API_HOTELS),
  obtenir: (id) => api.get(CONFIG.API_HOTEL_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_HOTELS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_HOTEL_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_HOTEL_DETAIL(id)),
};