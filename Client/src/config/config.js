import logoTransparent from "../assets/images/logo-transparent.png";

const BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://batevoyage-api.onrender.com";

const CONFIG = {
  BASE_URL,

  // --- Authentification ---
  API_LOGIN: `${BASE_URL}/api/auth/login/`,
  API_REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh/`,
  API_UTILISATEUR_MOI: `${BASE_URL}/api/utilisateurs/me/`,

  // --- Utilisateurs ---
  API_UTILISATEURS: `${BASE_URL}/api/utilisateurs/comptes/`,
  API_UTILISATEUR_DETAIL: (id) => `${BASE_URL}/api/utilisateurs/comptes/${id}/`,
  API_AGENTS_INSCRIPTEURS: `${BASE_URL}/api/utilisateurs/agents-inscripteurs/`,

  // --- Pèlerins ---
  API_PELERINS: `${BASE_URL}/api/pelerins/`,
  API_PELERIN_DETAIL: (id) => `${BASE_URL}/api/pelerins/${id}/`,
  API_PELERIN_FICHE_PDF: (id) => `${BASE_URL}/api/pelerins/${id}/fiche-pdf/`,
  API_PELERIN_DOCUMENT: (id, champ) => `${BASE_URL}/api/pelerins/${id}/document/${champ}/`,

  // --- Formules / Programmes ---
  API_PROGRAMMES: `${BASE_URL}/api/formules/programmes/`,

  CLOUDINARY_NAME: "cqavxalu",
};

export default CONFIG;

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