import api from "./api";
import CONFIG from "../config/config";

export const activiteService = {
  obtenirJournalGlobal: () => api.get(CONFIG.API_JOURNAL_GLOBAL),
};