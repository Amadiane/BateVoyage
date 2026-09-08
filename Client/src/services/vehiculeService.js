import api from "./api";
import CONFIG from "../config/config";

export const vehiculeService = {
  lister: (params) => api.get(CONFIG.API_VEHICULES, { params }),
  obtenir: (id) => api.get(CONFIG.API_VEHICULE_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_VEHICULES, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_VEHICULE_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_VEHICULE_DETAIL(id)),
  affecterPelerins: (id, pelerinIds) => api.post(`${CONFIG.API_VEHICULE_DETAIL(id)}affecter-pelerins/`, { pelerin_ids: pelerinIds }),
  affecterGroupe: (id, groupeId) => api.post(`${CONFIG.API_VEHICULE_DETAIL(id)}affecter-groupe/`, { groupe_id: groupeId }),
  retirerPelerin: (id, pelerinId) => api.post(`${CONFIG.API_VEHICULE_DETAIL(id)}retirer-pelerin/`, { pelerin_id: pelerinId }),
};