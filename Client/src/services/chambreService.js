import api from "./api";
import CONFIG from "../config/config";

export const chambreService = {
  lister: (params) => api.get(CONFIG.API_CHAMBRES, { params }),
  obtenir: (id) => api.get(CONFIG.API_CHAMBRE_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_CHAMBRES, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_CHAMBRE_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_CHAMBRE_DETAIL(id)),
  affecterPelerins: (id, pelerinIds) => api.post(CONFIG.API_CHAMBRE_AFFECTER(id), { pelerin_ids: pelerinIds }),
  retirerPelerin: (id, pelerinId) => api.post(CONFIG.API_CHAMBRE_RETIRER(id), { pelerin_id: pelerinId }),
};