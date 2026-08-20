import api from "./api";
import CONFIG from "../config/config";

export const paiementService = {
  lister: (params) => api.get(CONFIG.API_PAIEMENTS, { params }),
  obtenir: (id) => api.get(CONFIG.API_PAIEMENT_DETAIL(id)),
  creer: (formData) => api.post(CONFIG.API_PAIEMENTS, formData),
  modifier: (id, formData) => api.patch(CONFIG.API_PAIEMENT_DETAIL(id), formData),
  supprimer: (id) => api.delete(CONFIG.API_PAIEMENT_DETAIL(id)),
  urlRecuScan: (id) => CONFIG.API_PAIEMENT_RECU_SCAN(id),
  urlRecuPdf: (id) => CONFIG.API_PAIEMENT_RECU_PDF(id),
  obtenirResumeFinancier: () => api.get(CONFIG.API_RESUME_FINANCIER),
  verifierSuppression: (id) => api.get(CONFIG.API_PELERIN_VERIFIER_SUPPRESSION(id)),
  obtenirSuiviSoldes: () => api.get(CONFIG.API_SUIVI_SOLDES),
};