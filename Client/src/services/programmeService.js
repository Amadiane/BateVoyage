import api from "./api";
import CONFIG from "../config/config";

export const programmeService = {
  lister: () => api.get(CONFIG.API_PROGRAMMES),
};