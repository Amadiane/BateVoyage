import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api from "../services/api";
import CONFIG from "../config/config";

const AuthContext = createContext(null);

function obtenirStockage() {
  // "Se souvenir de moi" décoché → la session ne survit pas à la fermeture de l'onglet
  return localStorage.getItem("prefere_session") === "1" ? sessionStorage : localStorage;
}

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = async () => {
    try {
      const { data } = await api.get(CONFIG.API_UTILISATEUR_MOI);
      setUtilisateur(data);
    } catch {
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const stockage = obtenirStockage();
    const token = stockage.getItem("access");
    if (token) chargerProfil();
    else setChargement(false);
  }, []);

  const connecter = async (username, password, seSouvenir = true) => {
    const { data } = await axios.post(CONFIG.API_LOGIN, { username, password });

    const stockage = seSouvenir ? localStorage : sessionStorage;
    localStorage.setItem("prefere_session", seSouvenir ? "0" : "1");
    stockage.setItem("access", data.access);
    stockage.setItem("refresh", data.refresh);

    await chargerProfil();
  };

  const deconnecter = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);