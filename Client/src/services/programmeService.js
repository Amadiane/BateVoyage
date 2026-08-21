import api from "./api";
import CONFIG from "../config/config";

export const programmeService = {
  lister: (params) => api.get(CONFIG.API_PROGRAMMES, { params }),
  obtenir: (id) => api.get(`${CONFIG.API_PROGRAMMES}${id}/`),
  creer: (donnees) => api.post(CONFIG.API_PROGRAMMES, donnees),
  modifier: (id, donnees) => api.patch(`${CONFIG.API_PROGRAMMES}${id}/`, donnees),
  supprimer: (id) => api.delete(`${CONFIG.API_PROGRAMMES}${id}/`),
  affecterPelerins: (id, pelerinIds) => api.post(CONFIG.API_PROGRAMME_AFFECTER(id), { pelerin_ids: pelerinIds }),
  retirerPelerin: (id, pelerinId) => api.post(CONFIG.API_PROGRAMME_RETIRER(id), { pelerin_id: pelerinId }),
};