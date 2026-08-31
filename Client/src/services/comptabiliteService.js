import api from "./api";
import CONFIG from "../config/config";

export const comptabiliteService = {
  listerBonsSortie: (params) => api.get(CONFIG.API_BONS_SORTIE, { params }),
  creerBonSortie: (donnees) => api.post(CONFIG.API_BONS_SORTIE, donnees),
  modifierBonSortie: (id, donnees) => api.patch(CONFIG.API_BON_SORTIE_DETAIL(id), donnees),
  supprimerBonSortie: (id) => api.delete(CONFIG.API_BON_SORTIE_DETAIL(id)),

  listerDepenses: (params) => api.get(CONFIG.API_DEPENSES, { params }),
  creerDepense: (donnees) => api.post(CONFIG.API_DEPENSES, donnees),
  modifierDepense: (id, donnees) => api.patch(CONFIG.API_DEPENSE_DETAIL(id), donnees),
  supprimerDepense: (id) => api.delete(CONFIG.API_DEPENSE_DETAIL(id)),

  listerDettesFournisseurs: (params) => api.get(CONFIG.API_DETTES_FOURNISSEURS, { params }),
  creerDetteFournisseur: (donnees) => api.post(CONFIG.API_DETTES_FOURNISSEURS, donnees),
  modifierDetteFournisseur: (id, donnees) => api.patch(CONFIG.API_DETTE_FOURNISSEUR_DETAIL(id), donnees),
  supprimerDetteFournisseur: (id) => api.delete(CONFIG.API_DETTE_FOURNISSEUR_DETAIL(id)),

  obtenirResume: () => api.get(CONFIG.API_RESUME_COMPTABILITE),

  obtenirHistoriqueBonSortie: (id) => api.get(CONFIG.API_BON_SORTIE_HISTORIQUE(id)),
  obtenirHistoriqueDepense: (id) => api.get(CONFIG.API_DEPENSE_HISTORIQUE(id)),
  obtenirHistoriqueDetteFournisseur: (id) => api.get(CONFIG.API_DETTE_FOURNISSEUR_HISTORIQUE(id)),
  obtenirResume: (params) => api.get(CONFIG.API_RESUME_COMPTABILITE, { params }),
};