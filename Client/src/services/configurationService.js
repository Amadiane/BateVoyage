import api from "./api";
import CONFIG from "../config/config";

export const configurationService = {
  listerModules: () => api.get(CONFIG.API_MODULES_SYSTEME),
  modifierModule: (id, donnees) => api.patch(CONFIG.API_MODULE_SYSTEME_DETAIL(id), donnees),
};