import api from "./api";
import CONFIG from "../config/config";

export const documentsGeneresService = {
  listerModeles: () => api.get(CONFIG.API_MODELES_DOCUMENTS),
  obtenirModele: (type) => api.get(CONFIG.API_MODELE_DOCUMENT_DETAIL(type)),
  modifierModele: (type, donnees) => api.patch(CONFIG.API_MODELE_DOCUMENT_DETAIL(type), donnees),
  urlDocumentGenere: (pelerinId, type) => CONFIG.API_PELERIN_DOCUMENT_GENERE(pelerinId, type),
};