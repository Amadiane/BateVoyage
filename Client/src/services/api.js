import axios from "axios";
import CONFIG from "../config/config.js";

const api = axios.create({ baseURL: CONFIG.BASE_URL });

function obtenirStockage() {
  return localStorage.getItem("prefere_session") === "1" ? sessionStorage : localStorage;
}

api.interceptors.request.use((config) => {
  const token = obtenirStockage().getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const stockage = obtenirStockage();
        const refresh = stockage.getItem("refresh");
        const res = await axios.post(CONFIG.API_REFRESH_TOKEN, { refresh });
        stockage.setItem("access", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;