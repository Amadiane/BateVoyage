import logoTransparent from "../assets/images/logo-transparent.png";
import { LayoutDashboard, Users, UserCog, FileText, ScrollText, Calendar, Plane, Hotel, MessageSquareWarning, Ticket, Car, Package, Wallet } from "lucide-react";
const BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://batevoyage.onrender.com";

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
  API_BONS_SORTIE: `${BASE_URL}/api/comptabilite/bons-sortie/`,
  API_BON_SORTIE_DETAIL: (id) => `${BASE_URL}/api/comptabilite/bons-sortie/${id}/`,
  API_DEPENSES: `${BASE_URL}/api/comptabilite/depenses/`,
  API_DEPENSE_DETAIL: (id) => `${BASE_URL}/api/comptabilite/depenses/${id}/`,
  API_DETTES_FOURNISSEURS: `${BASE_URL}/api/comptabilite/dettes-fournisseurs/`,
  API_DETTE_FOURNISSEUR_DETAIL: (id) => `${BASE_URL}/api/comptabilite/dettes-fournisseurs/${id}/`,
  API_RESUME_COMPTABILITE: `${BASE_URL}/api/comptabilite/resume/`,
  API_BON_SORTIE_HISTORIQUE: (id) => `${BASE_URL}/api/comptabilite/bons-sortie/${id}/historique/`,
  API_DEPENSE_HISTORIQUE: (id) => `${BASE_URL}/api/comptabilite/depenses/${id}/historique/`,
  API_DETTE_FOURNISSEUR_HISTORIQUE: (id) => `${BASE_URL}/api/comptabilite/dettes-fournisseurs/${id}/historique/`,
  API_PERSONNEL: `${BASE_URL}/api/personnel/`,
  API_PERSONNEL_DETAIL: (id) => `${BASE_URL}/api/personnel/${id}/`,
  API_MODELES_DOCUMENTS: `${BASE_URL}/api/documents-generes/modeles/`,
  API_MODELE_DOCUMENT_DETAIL: (type) => `${BASE_URL}/api/documents-generes/modeles/${type}/`,
  API_PELERIN_DOCUMENT_GENERE: (id, type) => `${BASE_URL}/api/pelerins/${id}/document-genere/${type}/`,
  API_MODULES_SYSTEME: `${BASE_URL}/api/configuration/modules/`,
  API_MODULE_SYSTEME_DETAIL: (id) => `${BASE_URL}/api/configuration/modules/${id}/`,
  API_PELERINS_EXPORT_EXCEL: `${BASE_URL}/api/pelerins/export-excel/`,
  API_FORFAITS: `${BASE_URL}/api/formules/forfaits/`,
  API_FORFAIT_DETAIL: (id) => `${BASE_URL}/api/formules/forfaits/${id}/`,
  API_FORFAIT_EXPORT_PDF: (id) => `${BASE_URL}/api/formules/forfaits/${id}/export-pdf/`,
  API_PELERIN_FICHE_VISA: (id) => `${BASE_URL}/api/pelerins/${id}/fiche-visa/`,
  API_VOL_MANIFESTE_PDF: (id) => `${BASE_URL}/api/groupes-vols/vols/${id}/manifeste-pdf/`,

  API_VILLES: `${BASE_URL}/api/hebergement/villes/`,
  API_VILLE_DETAIL: (id) => `${BASE_URL}/api/hebergement/villes/${id}/`,
  API_CAMPEMENTS: `${BASE_URL}/api/hebergement/campements/`,
  API_CAMPEMENT_DETAIL: (id) => `${BASE_URL}/api/hebergement/campements/${id}/`,

  API_VEHICULES: `${BASE_URL}/api/groupes-vols/vehicules/`,
  API_VEHICULE_DETAIL: (id) => `${BASE_URL}/api/groupes-vols/vehicules/${id}/`,

  API_CATEGORIES_DECAISSEMENT: `${BASE_URL}/api/comptabilite/categories-decaissement/`,
  API_DECAISSEMENTS: `${BASE_URL}/api/comptabilite/decaissements/`,
  API_DECAISSEMENT_DETAIL: (id) => `${BASE_URL}/api/comptabilite/decaissements/${id}/`,
  API_TAUX_CHANGE: `${BASE_URL}/api/comptabilite/taux-change/`,

  API_SAISONS: `${BASE_URL}/api/comptabilite/saisons/`,

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
  fondateur: ["dashboard", "hajj", "oumra", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "reclamations", "journal", "comptabilite", "personnel", "modeles_documents", "modules_visibles"],
  admin_general: ["dashboard", "hajj", "oumra", "utilisateurs", "documents", "paiements", "programmes", "groupes", "hebergement", "reclamations", "journal", "comptabilite", "personnel", "modeles_documents"],
  comptable: ["dashboard", "paiements", "programmes", "hajj", "oumra","comptabilite"],
  secretaire: ["dashboard", "hajj", "oumra", "documents"],
  docteur: ["dashboard", "pelerins-sante"],
  traducteur: ["dashboard", "documents"],
  affaires_sociales: ["dashboard", "reclamations", "hajj", "oumra"],
  guide: ["dashboard", "groupes"],
  encadreur: ["dashboard", "groupes"],
  mounazim: ["dashboard", "groupes"],
  pelerin: ["mon-dossier"],
};





export const ITEMS_MENU = {
  dashboard: { cle: "menu_dashboard", path: "/dashboard", icone: LayoutDashboard },
  hajj: { cle: "menu_hajj", path: "/hajj", icone: Users },
  oumra: { cle: "menu_oumra", path: "/oumra", icone: Users },
  "pelerins-sante": { cle: "menu_pelerins_sante", path: "/pelerins-sante", icone: Users },
  utilisateurs: { cle: "menu_utilisateurs", path: "/utilisateurs", icone: UserCog },
  documents: { cle: "menu_documents", path: "/documents", icone: FileText },
  paiements: { cle: "menu_paiements", path: "/paiements", icone: FileText },
  programmes: { cle: "menu_programmes", path: "/programmes", icone: Calendar },
  groupes: { cle: "menu_groupes", path: "/groupes", icone: Plane },
  hebergement: { cle: "menu_hebergement", path: "/hebergement", icone: Hotel },
  reclamations: { cle: "menu_reclamations", path: "/reclamations", icone: MessageSquareWarning },
  "mon-dossier": { cle: "menu_mon_dossier", path: "/mon-dossier", icone: FileText },
  journal: { cle: "menu_journal", path: "/journal-activite", icone: ScrollText },
  comptabilite: { cle: "menu_comptabilite", path: "/comptabilite", icone: Wallet },
  personnel: { cle: "menu_personnel", path: "/personnel", icone: UserCog },
  modeles_documents: { cle: "menu_modeles_documents", path: "/modeles-documents", icone: FileText },
  modules_visibles: { cle: "menu_modules_visibles", path: "/parametres/modules", icone: FileText },
};