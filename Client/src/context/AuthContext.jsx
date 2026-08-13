import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api from "../services/api.js";
import CONFIG from "../config/config.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = async () => {
    try {
      const { data } = await api.get(CONFIG.API_UTILISATEUR_MOI);
      setUtilisateur(data);
      localStorage.setItem("user", JSON.stringify(data));
    } catch {
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) chargerProfil();
    else setChargement(false);
  }, []);

  const connecter = async (username, password) => {
    const { data } = await axios.post(CONFIG.API_LOGIN, { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    await chargerProfil();
  };

  const deconnecter = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);