import axios from "axios";
import CONFIG from "../config/config.js";

const api = axios.create({ baseURL: CONFIG.BASE_URL });

// Ajoute automatiquement le token à CHAQUE requête — sans ça, il
// faudrait rajouter le header Authorization à la main dans chaque page.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si le serveur répond 401 (token expiré), on tente UNE fois de le
// rafraîchir automatiquement avec le refresh token, sans déconnecter
// l'utilisateur pour un simple token expiré après 8h.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        const res = await axios.post(CONFIG.API_REFRESH_TOKEN, { refresh });
        localStorage.setItem("access", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;