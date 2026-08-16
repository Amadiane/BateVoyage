import api from "./api";
import CONFIG from "../config/config";

export const documentService = {
  obtenirTableauBord: () => api.get(CONFIG.API_DOCUMENTS_TABLEAU_BORD),
};