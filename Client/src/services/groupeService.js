import api from "./api";
import CONFIG from "../config/config";

export const groupeService = {
  lister: () => api.get(CONFIG.API_GROUPES),
  obtenir: (id) => api.get(CONFIG.API_GROUPE_DETAIL(id)),
  creer: (donnees) => api.post(CONFIG.API_GROUPES, donnees),
  modifier: (id, donnees) => api.patch(CONFIG.API_GROUPE_DETAIL(id), donnees),
  supprimer: (id) => api.delete(CONFIG.API_GROUPE_DETAIL(id)),
  urlManifestePdf: (id) => CONFIG.API_GROUPE_MANIFESTE_PDF(id),
  affecterPelerins: (id, pelerinIds) =>
    api.post(CONFIG.API_GROUPE_AFFECTER_PELERINS(id), { pelerin_ids: pelerinIds }),
  retirerPelerin: (id, pelerinId) =>
    api.post(CONFIG.API_GROUPE_RETIRER_PELERIN(id), { pelerin_id: pelerinId }),
};