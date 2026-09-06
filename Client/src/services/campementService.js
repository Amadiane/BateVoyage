import api from "./api";
import CONFIG from "../config/config";

export const campementService = {
  lister: (params) => api.get(CONFIG.API_CAMPEMENTS, { params }),
  creer: (donnees) => api.post(CONFIG.API_CAMPEMENTS, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_CAMPEMENT_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_CAMPEMENT_DETAIL(id)),
  affecterPelerins: (id, pelerinIds) => api.post(`${CONFIG.API_CAMPEMENT_DETAIL(id)}affecter-pelerins/`, { pelerin_ids: pelerinIds }),
  retirerPelerin: (id, pelerinId) => api.post(`${CONFIG.API_CAMPEMENT_DETAIL(id)}retirer-pelerin/`, { pelerin_id: pelerinId }),
};