import logoTransparent from "../assets/images/logo-transparent.png";
import { LayoutDashboard, Users, UserCog, FileText, ScrollText } from "lucide-react";


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

  API_DOCUMENTS_TABLEAU_BORD: `${BASE_URL}/api/documents/tableau-bord/`,

  API_PELERIN_HISTORIQUE: (id) => `${BASE_URL}/api/pelerins/${id}/historique/`,
  API_JOURNAL_GLOBAL: `${BASE_URL}/api/activite/global/`,
  API_UTILISATEUR_MOT_DE_PASSE: (id) => `${BASE_URL}/api/utilisateurs/comptes/${id}/mot-de-passe/`,
  API_UTILISATEUR_HISTORIQUE: (id) => `${BASE_URL}/api/utilisateurs/comptes/${id}/historique/`,

  API_PAIEMENTS: `${BASE_URL}/api/paiements/`,
  API_PAIEMENT_DETAIL: (id) => `${BASE_URL}/api/paiements/${id}/`,

  API_PAIEMENT_RECU_SCAN: (id) => `${BASE_URL}/api/paiements/${id}/recu-scan/`,
  API_PAIEMENT_RECU_PDF: (id) => `${BASE_URL}/api/paiements/${id}/recu-pdf/`,
  API_RESUME_FINANCIER: `${BASE_URL}/api/paiements/resume-financier/`,
  API_PELERIN_VERIFIER_SUPPRESSION: (id) => `${BASE_URL}/api/pelerins/${id}/verifier-suppression/`,
  API_PAIEMENTS_EXPORT_CSV: `${BASE_URL}/api/paiements/export-csv/`,
  API_SUIVI_SOLDES: `${BASE_URL}/api/paiements/suivi-soldes/`,
  API_VOLS: `${BASE_URL}/api/groupes-vols/vols/`,
  API_VOL_DETAIL: (id) => `${BASE_URL}/api/groupes-vols/vols/${id}/`,
  API_GROUPES: `${BASE_URL}/api/groupes-vols/groupes/`,
  API_GROUPE_DETAIL: (id) => `${BASE_URL}/api/groupes-vols/groupes/${id}/`,
  API_GROUPE_MANIFESTE_PDF: (id) => `${BASE_URL}/api/groupes-vols/groupes/${id}/manifeste-pdf/`,
  API_GROUPE_AFFECTER_PELERINS: (id) => `${BASE_URL}/api/groupes-vols/groupes/${id}/affecter-pelerins/`,
  API_GROUPE_RETIRER_PELERIN: (id) => `${BASE_URL}/api/groupes-vols/groupes/${id}/retirer-pelerin/`,
  API_HOTELS: `${BASE_URL}/api/hebergement/hotels/`,
  API_HOTEL_DETAIL: (id) => `${BASE_URL}/api/hebergement/hotels/${id}/`,
  API_CHAMBRES: `${BASE_URL}/api/hebergement/chambres/`,
  API_CHAMBRE_DETAIL: (id) => `${BASE_URL}/api/hebergement/chambres/${id}/`,
  API_CHAMBRE_AFFECTER: (id) => `${BASE_URL}/api/hebergement/chambres/${id}/affecter-pelerins/`,
  API_CHAMBRE_RETIRER: (id) => `${BASE_URL}/api/hebergement/chambres/${id}/retirer-pelerin/`,
  API_RECLAMATIONS: `${BASE_URL}/api/reclamations/`,
  API_RECLAMATION_DETAIL: (id) => `${BASE_URL}/api/reclamations/${id}/`,
  API_PROGRAMME_AFFECTER: (id) => `${BASE_URL}/api/formules/programmes/${id}/affecter-pelerins/`,
  API_PROGRAMME_RETIRER: (id) => `${BASE_URL}/api/formules/programmes/${id}/retirer-pelerin/`,

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
  comptable: ["dashboard", "paiements", "programmes", "pelerins"],
  secretaire: ["dashboard", "pelerins", "documents"],
  docteur: ["dashboard", "pelerins-sante"],
  traducteur: ["dashboard", "documents"],
  affaires_sociales: ["dashboard", "reclamations", "pelerins"],
  guide: ["dashboard", "groupes"],
  encadreur: ["dashboard", "groupes"],
  mounazim: ["dashboard", "groupes"],
  pelerin: ["mon-dossier"],
  fondateur: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "journal"],
  admin_general: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "journal"],
  secretaire: ["dashboard", "pelerins", "documents", "groupes", "hebergement"],
  guide: ["dashboard", "groupes", "hebergement"],
  encadreur: ["dashboard", "groupes", "hebergement"],
  mounazim: ["dashboard", "groupes", "hebergement"],
  fondateur: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "reclamations", "journal"],
  admin_general: ["dashboard", "pelerins", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "reclamations", "journal"],
  affaires_sociales: ["dashboard", "reclamations", "pelerins"],
};

export const ITEMS_MENU = {
  dashboard: { cle: "menu_dashboard", path: "/dashboard", icone: LayoutDashboard },
  pelerins: { cle: "menu_pelerins", path: "/pelerins", icone: Users },
  "pelerins-sante": { cle: "menu_pelerins_sante", path: "/pelerins-sante", icone: Users },
  utilisateurs: { cle: "menu_utilisateurs", path: "/utilisateurs", icone: UserCog },
  documents: { cle: "menu_documents", path: "/documents", icone: FileText },
  paiements: { cle: "menu_paiements", path: "/paiements", icone: FileText },
  groupes: { cle: "menu_groupes", path: "/groupes", icone: FileText },
  reclamations: { cle: "menu_reclamations", path: "/reclamations", icone: FileText },
  "mon-dossier": { cle: "menu_mon_dossier", path: "/mon-dossier", icone: FileText },
  journal: { cle: "menu_journal", path: "/journal-activite", icone: ScrollText },
  programmes: { cle: "menu_programmes", path: "/programmes" },
  hebergement: { cle: "menu_hebergement", path: "/hebergement" },
  reclamations: { cle: "menu_reclamations", path: "/reclamations" },
};