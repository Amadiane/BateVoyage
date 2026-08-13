import logoTransparent from "../assets/images/logo-transparent.png";

const BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://batevoyage-api.onrender.com"; // à remplacer une fois déployé sur Render

const CONFIG = {
  BASE_URL,

  // --- Authentification ---
  API_LOGIN: `${BASE_URL}/api/auth/login/`,
  API_REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh/`,
  API_UTILISATEUR_MOI: `${BASE_URL}/api/utilisateurs/me/`,

  // --- Utilisateurs (comptes employés) ---
  API_UTILISATEURS: `${BASE_URL}/api/utilisateurs/comptes/`,
  API_UTILISATEUR_DETAIL: (id) => `${BASE_URL}/api/utilisateurs/comptes/${id}/`,

  // --- Pèlerins ---
  API_PELERINS: `${BASE_URL}/api/pelerins/`,
  API_PELERIN_DETAIL: (id) => `${BASE_URL}/api/pelerins/${id}/`,

  // --- Modules à venir (décommenter/compléter au fur et à mesure) ---
  // API_PROGRAMMES: `${BASE_URL}/api/formules/programmes/`,
  // API_PAIEMENTS: `${BASE_URL}/api/paiements/`,
  // API_DOCUMENTS: `${BASE_URL}/api/documents/`,
  // API_GROUPES: `${BASE_URL}/api/groupes-vols/groupes/`,

  CLOUDINARY_NAME: "ton_cloud_name",
};

export default CONFIG;

// ------------------------------------------------------------------
// Identité de l'agence — utilisée dans l'app ET pour la conformité
// visuelle des futurs PDF (devis, factures, badges pèlerins)
// ------------------------------------------------------------------
export const ENTREPRISE = {
  nomCourt: "BVG",
  nomComplet: "BATE VOYAGE GUINÉE",
  nomArabe: "وكالة باتي للسفريات - العمرة والحج",
  slogan: "Agence de voyage pour le HAJJ, TOURISME & OUMRA",
  adresse: "Guinée, Conakry — Matoto marché",
  telephones: ["620-116-076", "622-656-040"],
  email: "batevoyage@gmail.com",
  logo: logoTransparent,
};

// ------------------------------------------------------------------
// Menu par rôle (11 utilisateurs du système)
// ------------------------------------------------------------------
export const MENU_PAR_ROLE = {
  fondateur: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "groupes"],
  admin_general: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "groupes"],
  comptable: ["dashboard", "paiements", "pelerins"],
  secretaire: ["dashboard", "pelerins", "documents"],
  docteur: ["dashboard", "pelerins-sante"],
  traducteur: ["dashboard", "documents"],
  affaires_sociales: ["dashboard", "reclamations", "pelerins"],
  guide: ["dashboard", "groupes"],
  encadreur: ["dashboard", "groupes"],
  mounazim: ["dashboard", "groupes"],
  pelerin: ["mon-dossier"],
};

export const ITEMS_MENU = {
  dashboard: { label: "Tableau de bord", path: "/dashboard" },
  pelerins: { label: "Pèlerins", path: "/pelerins" },
  "pelerins-sante": { label: "Suivi santé", path: "/pelerins-sante" },
  utilisateurs: { label: "Utilisateurs", path: "/utilisateurs" },
  documents: { label: "Documents", path: "/documents" },
  paiements: { label: "Paiements", path: "/paiements" },
  groupes: { label: "Groupes & vols", path: "/groupes" },
  reclamations: { label: "Réclamations", path: "/reclamations" },
  "mon-dossier": { label: "Mon dossier", path: "/mon-dossier" },
};