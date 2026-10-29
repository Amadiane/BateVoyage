import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users, FileWarning, FileClock, Wallet, MessageSquareWarning, Plane, Building2, Bell,
  ChevronDown, LogOut, User, TrendingUp, TrendingDown, PiggyBank, UserX, UserPlus, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { pelerinService } from "../../services/pelerinService";
import { documentService } from "../../services/documentService";
import { reclamationService } from "../../services/reclamationService";
import { groupeService } from "../../services/groupeService";
import { hotelService } from "../../services/hotelService";
import { paiementService } from "../../services/paiementService";
import { decaissementService } from "../../services/decaissementService";
import imageKaaba from "../../assets/images/kaaba.jpg";
import styles from "../../theme/pages/dashboard/Dashboard.module.css";

const COULEURS_STATUT = {
  inscrit: "#9CA3AF",
  en_preparation: "#F59E0B",
  valide: "#0B3FA0",
  en_voyage: "#2B6CE0",
  retourne: "#10B981",
  cloture: "#6B7280",
};

// Couleurs fixées en JS (plutôt que via des classes CSS existantes dont on n'a pas
// le contenu) pour garantir un rendu coloré dès le premier essai.
const COULEURS_CARTE = {
  bleu: "#2B6CE0",
  orange: "#E08A2B",
  or: "#C9972B",
  vert: "#1F7A4D",
  rouge: "#B4433A",
  violet: "#7C5CBF",
};

const COULEURS_GENRE = { M: "#2B6CE0", F: "#D6458B", inconnu: "#9CA3AF" };

const COULEURS_PAIEMENT = {
  complet: "#1F7A4D",
  normal: "#2B6CE0",
  a_surveiller: "#E08A2B",
  en_retard: "#B4433A",
  indetermine: "#9CA3AF",
  archive: "#6B7280",
};
const LIBELLES_PAIEMENT = {
  complet: "Paiement complet",
  normal: "Paiement normal",
  a_surveiller: "À surveiller",
  en_retard: "En retard",
  indetermine: "Échéance non définie",
  archive: "Programme archivé",
};

const COULEURS_VISA = {
  obtenu: "#1F7A4D",
  en_cours: "#E08A2B",
  non_demande: "#9CA3AF",
  refuse: "#B4433A",
  expire: "#7C5CBF",
};

const ORDRE_STATUTS = ["inscrit", "en_preparation", "valide", "en_voyage", "retourne", "cloture"];
const ORDRE_PAIEMENT = ["complet", "normal", "a_surveiller", "en_retard", "indetermine", "archive"];
const ORDRE_VISA = ["obtenu", "en_cours", "non_demande", "refuse", "expire"];

// Disposition des cartes de statistiques :
//  "vedette"   = la première carte (Total pèlerins) est grande, les autres forment une grille à côté ;
//  "equilibre" = deux lignes de cartes de même largeur, sans case vide.
// "vedette" se replie automatiquement sur "equilibre" quand le nombre de cartes ne s'y prête pas.
const DISPOSITION_CARTES = "equilibre";

// Hauteur minimale du bandeau d'accueil (px)
const HAUTEUR_BANDEAU = 190;

// Couleurs volontairement différentes de celles des statuts (anneau extérieur)
const COULEURS_ACTIVITE = { hajj: "#0E7490", oumra: "#7C5CBF" };

const PALETTE = ["#0B3FA0", "#C9972B", "#1F7A4D", "#7C5CBF", "#E08A2B", "#2B6CE0", "#B4433A"];
const AGENCE_PRINCIPALE = "BATE VOYAGE GUINÉE";
const ALIAS_AGENCES = { "MANDENG VOYAGE GUINÉE": "MANDEN VOYAGE" };

const ROLES_VOIENT_FINANCES = ["fondateur", "admin_general", "comptable", "secretaire"];
const ROLES_VOIENT_RECLAMATIONS = ["fondateur", "admin_general", "affaires_sociales"];
const ROLES_VOIENT_LOGISTIQUE = ["fondateur", "admin_general", "secretaire", "guide", "encadreur", "mounazim"];

// Le service pèlerin filtre par "type_voyage" (pelerinage/oumra), pas par "activite"
// (hajj/oumra) comme le fait le service comptabilité — cf. PageDecaissement.jsx.
const TYPE_VOYAGE_PAR_ACTIVITE = { hajj: "pelerinage", oumra: "oumra" };

const DEVISES = ["GNF", "USD", "SAR"];

function sommerParDevise(liste) {
  return DEVISES.reduce((acc, dev) => {
    acc[dev] = liste.filter((x) => x.devise === dev).reduce((s, x) => s + parseFloat(x.montant), 0);
    return acc;
  }, {});
}

function formaterMontantsNonNuls(totaux) {
  return DEVISES.filter((d) => totaux[d] > 0).map((d) => `${totaux[d].toLocaleString("fr-FR")} ${d}`).join(" · ") || "0";
}

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { utilisateur, deconnecter } = useAuth();
  const [pelerins, setPelerins] = useState([]);
  const [docs, setDocs] = useState(null);
  const [reclamationsOuvertes, setReclamationsOuvertes] = useState(0);
  const [groupes, setGroupes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [resumeFinancier, setResumeFinancier] = useState(null);
  const [dettesOuvertes, setDettesOuvertes] = useState([]);
  const [creancesOuvertes, setCreancesOuvertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef(null);

  // ---------- Sélecteur Global / Hajj / Omra ----------
  const [activiteVue, setActiviteVue] = useState("global");
  const [financeActivite, setFinanceActivite] = useState(null);
  const [chargementFinanceActivite, setChargementFinanceActivite] = useState(false);

  const peutVoirFinances = ROLES_VOIENT_FINANCES.includes(utilisateur?.role);
  const peutVoirReclamations = ROLES_VOIENT_RECLAMATIONS.includes(utilisateur?.role);
  const peutVoirLogistique = ROLES_VOIENT_LOGISTIQUE.includes(utilisateur?.role);

  useEffect(() => {
    const requetes = [pelerinService.lister()];
    if (peutVoirFinances) {
      requetes.push(documentService.obtenirTableauBord());
      requetes.push(paiementService.obtenirResumeFinancier());
      requetes.push(decaissementService.listerDettes({ soldee: false }));
      requetes.push(decaissementService.listerCreances({ soldee: false }));
    }
    if (peutVoirReclamations) requetes.push(reclamationService.lister({ statut: "nouvelle" }));
    if (peutVoirLogistique) {
      requetes.push(groupeService.lister());
      requetes.push(hotelService.lister());
    }

    Promise.all(requetes).then((resultats) => {
      let i = 0;
      setPelerins(resultats[i++].data);
      if (peutVoirFinances) {
        setDocs(resultats[i++].data);
        setResumeFinancier(resultats[i++].data);
        setDettesOuvertes(resultats[i++].data);
        setCreancesOuvertes(resultats[i++].data);
      }
      if (peutVoirReclamations) setReclamationsOuvertes(resultats[i++].data.length);
      if (peutVoirLogistique) {
        setGroupes(resultats[i++].data);
        setHotels(resultats[i++].data);
      }
      setChargement(false);
    });
  }, []);

  useEffect(() => {
    function fermerSiExterieur(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  // Rechargement des pèlerins filtrés + du bloc financier dédié quand on change d'activité.
  useEffect(() => {
    if (activiteVue === "global") {
      pelerinService.lister().then(({ data }) => setPelerins(data));
      setFinanceActivite(null);
      return;
    }

    pelerinService.lister({ type_voyage: TYPE_VOYAGE_PAR_ACTIVITE[activiteVue] }).then(({ data }) => setPelerins(data));

    if (!peutVoirFinances) return;

    setChargementFinanceActivite(true);
    decaissementService.listerSaisons(activiteVue).then(async ({ data: saisons }) => {
      const saisonActive = saisons.find((s) => s.est_active) || saisons[0];
      if (!saisonActive) {
        setFinanceActivite({ saison: null });
        setChargementFinanceActivite(false);
        return;
      }
      const [beneficeRes, recapRes, encaissRes] = await Promise.all([
        decaissementService.obtenirBeneficeGlobal(activiteVue, saisonActive.id),
        decaissementService.obtenirRecapitulatif(activiteVue, null, saisonActive.id),
        decaissementService.obtenirEncaissements(activiteVue),
      ]);
      const ligneBeneficeReel = beneficeRes.data.lignes.find((l) => l.cle === "benefice_reel");
      setFinanceActivite({
        saison: saisonActive,
        beneficeReel: ligneBeneficeReel?.valeurs || { gnf: 0, usd: 0, sar: 0 },
        decaisse: recapRes.data.total_general || { gnf: 0, usd: 0, sar: 0 },
        encaisseGnf: encaissRes.data.total || 0,
      });
      setChargementFinanceActivite(false);
    });
  }, [activiteVue]);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  // ---------- Statistiques calculées à partir des pèlerins déjà chargés ----------
  const totalPelerins = pelerins.length;
  const compter = (fonctionCle) =>
    pelerins.reduce((acc, p) => {
      const cle = fonctionCle(p);
      acc[cle] = (acc[cle] || 0) + 1;
      return acc;
    }, {});
  const ordonner = (comptage, ordre) => [
    ...ordre.filter((k) => comptage[k]),
    ...Object.keys(comptage).filter((k) => !ordre.includes(k)),
  ];

  const parStatut = compter((p) => p.statut);
  const repartition = ordonner(parStatut, ORDRE_STATUTS).map((statut) => ({
    statut,
    cle: statut,
    libelle: t(`statut_${statut}`),
    valeur: parStatut[statut],
    couleur: COULEURS_STATUT[statut] || "#9CA3AF",
    sousTexte:
      activiteVue === "global"
        ? `${t("hajj")} ${pelerins.filter((p) => p.statut === statut && p.type_voyage === "pelerinage").length} · ${t("oumra")} ${pelerins.filter((p) => p.statut === statut && p.type_voyage === "oumra").length}`
        : null,
  }));

  const nbHommes = pelerins.filter((p) => p.sexe === "M").length;
  const nbFemmes = pelerins.filter((p) => p.sexe === "F").length;
  const nbSexeInconnu = totalPelerins - nbHommes - nbFemmes;
  const repartitionGenre = [
    { cle: "M", libelle: t("hommes", "Hommes"), valeur: nbHommes, couleur: COULEURS_GENRE.M },
    { cle: "F", libelle: t("femmes", "Femmes"), valeur: nbFemmes, couleur: COULEURS_GENRE.F },
    ...(nbSexeInconnu > 0
      ? [{ cle: "inconnu", libelle: t("non_renseigne", "Non renseigné"), valeur: nbSexeInconnu, couleur: COULEURS_GENRE.inconnu }]
      : []),
  ];

  const parPaiement = compter((p) => p.statut_paiement || "indetermine");
  const repartitionPaiement = ordonner(parPaiement, ORDRE_PAIEMENT).map((k) => ({
    cle: k,
    libelle: t(`statut_paiement_${k}`, LIBELLES_PAIEMENT[k] || k),
    valeur: parPaiement[k],
    couleur: COULEURS_PAIEMENT[k] || "#9CA3AF",
  }));

  const parVisa = compter((p) => p.statut_visa || "non_demande");
  const repartitionVisa = ordonner(parVisa, ORDRE_VISA).map((k) => ({
    cle: k,
    libelle: t(`visa_${k}`),
    valeur: parVisa[k],
    couleur: COULEURS_VISA[k] || "#9CA3AF",
  }));

  const nbIncomplets = pelerins.filter((p) => p.elements_manquants && p.elements_manquants.length > 0).length;
  const repartitionDossiers = [
    { cle: "complets", libelle: t("dossiers_complets", "Dossiers complets"), valeur: totalPelerins - nbIncomplets, couleur: "#1F7A4D" },
    { cle: "incomplets", libelle: t("dossiers_incomplets"), valeur: nbIncomplets, couleur: "#E08A2B" },
  ];

  const parAgence = compter((p) => {
    const brut = (p.agence_partenaire || "").trim();
    return ALIAS_AGENCES[brut] || brut || AGENCE_PRINCIPALE;
  });
  const repartitionAgences = Object.entries(parAgence)
    .sort((a, b) => b[1] - a[1])
    .map(([nom, valeur], i) => ({ cle: nom, libelle: nom, valeur, couleur: PALETTE[i % PALETTE.length] }));

  const parInscripteur = compter((p) => (p.inscripteur || "").trim() || t("non_renseigne", "Non renseigné"));
  const repartitionInscripteurs = Object.entries(parInscripteur)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nom, valeur], i) => ({ cle: nom, libelle: nom, valeur, couleur: PALETTE[i % PALETTE.length] }));

  // Inscriptions des 6 derniers mois (nécessite la date d'inscription dans la liste)
  const moisAffiches = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1);
    return { annee: d.getFullYear(), mois: d.getMonth(), libelle: d.toLocaleDateString("fr-FR", { month: "short" }), valeur: 0 };
  });
  let aDatesInscription = false;
  pelerins.forEach((p) => {
    if (!p.date_inscription) return;
    aDatesInscription = true;
    const d = new Date(p.date_inscription);
    const cible = moisAffiches.find((m) => m.annee === d.getFullYear() && m.mois === d.getMonth());
    if (cible) cible.valeur += 1;
  });
  const maxMois = Math.max(1, ...moisAffiches.map((m) => m.valeur));

  const nbHajj = pelerins.filter((p) => p.type_voyage === "pelerinage").length;
  const nbOumra = pelerins.filter((p) => p.type_voyage === "oumra").length;

  const montantTotal = peutVoirFinances
    ? pelerins.reduce((s, p) => s + parseFloat(p.montant_total_verse || 0), 0)
    : null;

  const aujourdhui = new Date();
  const prochainsDeparts = groupes
    .filter((g) => g.vol_aller_detail && new Date(g.vol_aller_detail.date_vol) >= aujourdhui)
    .sort((a, b) => new Date(a.vol_aller_detail.date_vol) - new Date(b.vol_aller_detail.date_vol))
    .slice(0, 4);

  const dateAujourdhui = aujourdhui.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const initiales = `${utilisateur?.first_name?.[0] || ""}${utilisateur?.last_name?.[0] || utilisateur?.username?.[0] || ""}`.toUpperCase();

  const dettesOuvertesParDevise = sommerParDevise(dettesOuvertes);
  const creancesOuvertesParDevise = sommerParDevise(creancesOuvertes);

  const statutSaison = (saison) => {
    if (!saison) return null;
    const debut = new Date(saison.date_debut);
    const fin = new Date(saison.date_fin);
    if (aujourdhui < debut) return { texte: t("saison_a_venir"), classe: styles.badgeSaisonAVenir };
    if (aujourdhui > fin) return { texte: t("saison_terminee"), classe: styles.badgeSaisonTerminee };
    return { texte: t("saison_en_cours"), classe: styles.badgeSaisonEnCours };
  };

  // Colonne de droite (départs + paiements + visas + dossiers) : vide pour les rôles qui n'y voient rien
  const colonneDroiteVide = !peutVoirLogistique && !(peutVoirFinances && totalPelerins > 0);

  // Cartes de statistiques affichées selon le rôle de l'utilisateur
  const cartesStat = [
    {
      cle: "total", icone: Users, chiffre: pelerins.length, couleur: "bleu", chemin: "/pelerins",
      label: activiteVue === "global" ? t("total_pelerins") : `${t("total_pelerins")} — ${t(activiteVue)}`,
    },
    ...(peutVoirFinances
      ? [
          { cle: "incomplets", icone: FileWarning, chiffre: docs?.total_dossiers_incomplets ?? docs?.dossiers_incomplets?.length ?? 0, label: t("dossiers_incomplets"), couleur: "orange", chemin: "/documents" },
          { cle: "visas", icone: FileClock, chiffre: docs?.visas_en_attente?.length ?? 0, label: t("visas_en_attente"), couleur: "or", chemin: "/documents" },
          { cle: "verse", icone: Wallet, chiffre: `${montantTotal.toLocaleString("fr-FR")} GNF`, label: t("montant_total_verse"), couleur: "vert", chemin: "/paiements" },
        ]
      : []),
    ...(peutVoirReclamations
      ? [{ cle: "reclamations", icone: MessageSquareWarning, chiffre: reclamationsOuvertes, label: t("reclamations_nouvelles"), couleur: "rouge", chemin: "/reclamations" }]
      : []),
    ...(peutVoirLogistique
      ? [
          { cle: "groupes", icone: Plane, chiffre: groupes.length, label: t("groupes_actifs"), couleur: "violet", chemin: "/groupes" },
          { cle: "hotels", icone: Building2, chiffre: hotels.length, label: t("hotels_enregistres"), couleur: "bleu", chemin: "/hebergement" },
        ]
      : []),
  ].map((c) => ({ ...c, onClick: () => navigate(c.chemin) }));

  return (
    <div>
      {/* ---------- Bandeau héro ---------- */}
      <div
        className={styles.hero}
        style={{ backgroundImage: `url(${imageKaaba})`, minHeight: HAUTEUR_BANDEAU, display: "flex", alignItems: "center" }}
      >
        <div className={styles.heroOverlay} />

        <div
          className={styles.heroLigne}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", padding: "18px 0" }}
        >
          {/* Identité : avatar, salutation, rôle et date */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
            <div
              style={{
                width: 76, height: 76, borderRadius: 22, flexShrink: 0, overflow: "hidden",
                background: "#fff", color: "#0B3FA0", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, boxShadow: "0 8px 22px rgba(0,0,0,0.28)",
              }}
            >
              {utilisateur?.photo ? (
                <img src={utilisateur.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initiales || <User size={30} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className={styles.heroVerset} style={{ margin: "0 0 6px", textAlign: "left" }}>وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ</p>
              <h1 className={styles.heroTitre} style={{ margin: 0, lineHeight: 1.15, overflowWrap: "anywhere" }}>
                {t("bienvenue_virgule")} {utilisateur?.first_name || utilisateur?.username}
              </h1>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <span style={stylePastilleHero}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399" }} />
                  {t("connecte_en_tant_que")} {utilisateur?.role_display}
                </span>
                <span style={stylePastilleHero}>{dateAujourdhui}</span>
              </div>
            </div>
          </div>

          {/* Chiffres clés + notifications + profil */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ChiffreHero icone={Users} valeur={pelerins.length} libelle={t("total_pelerins")} />
              {peutVoirFinances && (
                <>
                  <ChiffreHero icone={FileClock} valeur={docs?.visas_en_attente?.length ?? 0} libelle={t("visas_en_attente")} />
                  <ChiffreHero icone={FileWarning} valeur={docs?.total_dossiers_incomplets ?? docs?.dossiers_incomplets?.length ?? 0} libelle={t("dossiers_incomplets")} />
                </>
              )}
            </div>

            <div className={styles.heroDroite}>
              <button className={styles.heroBoutonNotif}>
                <Bell size={16} />
              </button>

            <div className={styles.heroMenuProfil} ref={menuRef}>
              <button className={styles.heroBoutonProfil} onClick={() => setMenuOuvert((v) => !v)}>
                {utilisateur?.photo ? (
                  <img src={utilisateur.photo} alt="" className={styles.heroPhotoProfil} />
                ) : (
                  <div className={styles.heroAvatarInitiales}>{initiales || <User size={14} />}</div>
                )}
                <span className={styles.heroNomProfil}>{utilisateur?.first_name || utilisateur?.username}</span>
                <ChevronDown size={13} className={`${styles.heroChevron} ${menuOuvert ? styles.heroChevronOuvert : ""}`} />
              </button>

              {menuOuvert && (
                <div className={styles.heroDropdown}>
                  <div className={styles.heroDropdownEntete}>
                    <p className={styles.heroDropdownNom}>{utilisateur?.first_name} {utilisateur?.last_name}</p>
                    <p className={styles.heroDropdownRole}>{utilisateur?.role_display}</p>
                  </div>
                  <button className={styles.heroDropdownDeconnexion} onClick={deconnecter}>
                    <LogOut size={14} /> {t("se_deconnecter")}
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Sélecteur Global / Hajj / Omra ---------- */}
      <div className={styles.toggleActivite}>
        {[
          { cle: "global", label: t("vue_globale") },
          { cle: "hajj", label: t("hajj") },
          { cle: "oumra", label: t("oumra") },
        ].map((opt) => (
          <button
            key={opt.cle}
            className={activiteVue === opt.cle ? styles.toggleActiviteBoutonActif : styles.toggleActiviteBouton}
            onClick={() => setActiviteVue(opt.cle)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ---------- Cartes statistiques en tuiles dégradées ---------- */}
      <style>{STYLE_CARTES}</style>
      <DispositionCartes cartes={cartesStat} />

      {/* ---------- Situation financière de l'activité sélectionnée ---------- */}
      {peutVoirFinances && activiteVue !== "global" && (
        <div className={styles.cartePrincipale} style={{ marginBottom: 20 }}>
          <div className={styles.enteteCarteAvecLien}>
            <h2 className={styles.titreCarte}>
              {t("situation_financiere")} — {t(activiteVue)}
              {financeActivite?.saison && (
                <span className={statutSaison(financeActivite.saison)?.classe} style={{ marginLeft: 10 }}>
                  {financeActivite.saison.nom} · {statutSaison(financeActivite.saison)?.texte}
                </span>
              )}
            </h2>
            <button className={styles.lienVoirTout} onClick={() => navigate(`/comptabilite/finances/benefice-global?activite=${activiteVue}`)}>
              {t("voir_tout")}
            </button>
          </div>

          {chargementFinanceActivite && <p className={styles.etatVide}>{t("chargement")}</p>}

          {!chargementFinanceActivite && financeActivite && !financeActivite.saison && (
            <p className={styles.etatVide}>{t("aucune_saison")}</p>
          )}

          {!chargementFinanceActivite && financeActivite?.saison && (
            <div className={styles.blocsFinanceColores}>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceOr}`}>
                <div className={styles.iconeBlocFinance}><PiggyBank size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.beneficeReel.gnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("benefice_reel")}</p>
                </div>
              </div>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceRouge}`}>
                <div className={styles.iconeBlocFinance}><TrendingDown size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.decaisse.gnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("total_decaisse")}</p>
                </div>
              </div>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceVert}`}>
                <div className={styles.iconeBlocFinance}><TrendingUp size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.encaisseGnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("total_encaisse")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Grille principale : statut + genre | départs + paiements + visas + dossiers ---------- */}
      <div className={colonneDroiteVide ? undefined : "bvg-deux-colonnes"}>
        <div className="bvg-pile">
          <div className={`${styles.cartePrincipale} ${styles.accentHautViolet}`}>
            <h2 className={styles.titreCarte}>{t("repartition_statuts")}</h2>
            {activiteVue === "global" && totalPelerins > 0 && (
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                {[
                  { cle: "hajj", libelle: t("hajj"), valeur: nbHajj },
                  { cle: "oumra", libelle: t("oumra"), valeur: nbOumra },
                ].map((a) => (
                  <div
                    key={a.cle}
                    style={{ flex: 1, background: `${COULEURS_ACTIVITE[a.cle]}14`, border: `1px solid ${COULEURS_ACTIVITE[a.cle]}30`, borderRadius: 12, padding: "10px 14px" }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 700, color: COULEURS_ACTIVITE[a.cle], lineHeight: 1.1 }}>{a.valeur}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{a.libelle} · {pourcentage(a.valeur, totalPelerins)} %</div>
                  </div>
                ))}
              </div>
            )}
            {repartition.length === 0 ? (
              <p className={styles.etatVide}>{t("aucun_pelerin")}</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                <DonutCentre
                  donnees={
                    activiteVue === "global"
                      ? [
                          { cle: "hajj", libelle: t("hajj"), valeur: nbHajj, couleur: COULEURS_ACTIVITE.hajj },
                          { cle: "oumra", libelle: t("oumra"), valeur: nbOumra, couleur: COULEURS_ACTIVITE.oumra },
                        ]
                      : repartition
                  }
                  total={totalPelerins}
                  libelleTotal={t("pelerins", "Pèlerins")}
                  hauteur={190}
                />
                <BarresRepartition lignes={repartition} total={totalPelerins} />
              </div>
            )}
          </div>

          {totalPelerins > 0 && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautBleu}`}>
              <h2 className={styles.titreCarte}>{t("repartition_genre", "Répartition par genre")}</h2>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                {repartitionGenre.filter((g) => g.cle !== "inconnu").map((g) => (
                  <div key={g.cle} style={{ flex: 1, background: `${g.couleur}14`, border: `1px solid ${g.couleur}30`, borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: g.couleur, lineHeight: 1.1 }}>{g.valeur}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{g.libelle} · {pourcentage(g.valeur, totalPelerins)} %</div>
                  </div>
                ))}
              </div>
              <DonutCentre donnees={repartitionGenre} total={totalPelerins} libelleTotal={t("pelerins", "Pèlerins")} hauteur={170} />
            </div>
          )}
        </div>

        {!colonneDroiteVide && (
          <div className="bvg-pile">
          {peutVoirLogistique && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautBleu}`}>
              <div className={styles.enteteCarteAvecLien}>
                <h2 className={styles.titreCarte}>{t("prochains_departs")}</h2>
                <button className={styles.lienVoirTout} onClick={() => navigate("/groupes")}>{t("voir_tout")}</button>
              </div>
              {prochainsDeparts.length === 0 ? (
                <p className={styles.etatVide}>{t("aucun_depart_a_venir")}</p>
              ) : (
                <div className={styles.listeDeparts}>
                  {prochainsDeparts.map((g) => (
                    <div key={g.id} className={styles.ligneDepart} onClick={() => navigate(`/groupes/${g.id}`)}>
                      <div className={styles.dateDepart}>
                        <span className={styles.jourDepart}>{new Date(g.vol_aller_detail.date_vol).getDate()}</span>
                        <span className={styles.moisDepart}>{new Date(g.vol_aller_detail.date_vol).toLocaleDateString("fr-FR", { month: "short" })}</span>
                      </div>
                      <div className={styles.infosDepart}>
                        <p className={styles.nomGroupeDepart}>{g.nom}</p>
                        <p className={styles.trajetDepart}>{g.vol_aller_detail.aeroport_depart} → {g.vol_aller_detail.aeroport_arrivee}</p>
                      </div>
                      <span className={styles.nbPelerinsDepart}>{g.nb_pelerins}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

            {peutVoirFinances && totalPelerins > 0 && (
              <>
            <div className={`${styles.cartePrincipale} ${styles.accentHautVert}`}>
              <h2 className={styles.titreCarte}>{t("situation_paiements", "Situation des paiements")}</h2>
              <BarresRepartition lignes={repartitionPaiement} total={totalPelerins} />
            </div>
            <div className={`${styles.cartePrincipale} ${styles.accentHautOr}`}>
              <h2 className={styles.titreCarte}>{t("situation_visas", "Situation des visas")}</h2>
              <BarresRepartition lignes={repartitionVisa} total={totalPelerins} />
            </div>
            <div className={`${styles.cartePrincipale} ${styles.accentHautVert}`}>
              <h2 className={styles.titreCarte}>{t("etat_des_dossiers", "État des dossiers")}</h2>
              <BarresRepartition lignes={repartitionDossiers} total={totalPelerins} />
            </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ---------- Agences, inscripteurs, inscriptions par mois (3 cartes de même taille) ---------- */}
      {peutVoirFinances && totalPelerins > 0 && (
        <div className="bvg-trois-colonnes" style={{ "--cols": aDatesInscription ? 3 : 2 }}>
          <div className={`${styles.cartePrincipale} ${styles.accentHautViolet}`} style={styleCarteEgale}>
            <h2 className={styles.titreCarte}>{t("repartition_agences", "Répartition par agence")}</h2>
            <BarresRepartition lignes={repartitionAgences} total={totalPelerins} />
          </div>

          <div className={`${styles.cartePrincipale} ${styles.accentHautBleu}`} style={styleCarteEgale}>
            <h2 className={styles.titreCarte}>{t("top_inscripteurs", "Inscriptions par inscripteur")}</h2>
            <BarresRepartition lignes={repartitionInscripteurs} total={totalPelerins} />
          </div>

          {aDatesInscription && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautVert}`} style={styleCarteEgale}>
              <h2 className={styles.titreCarte}>{t("inscriptions_par_mois", "Inscriptions des 6 derniers mois")}</h2>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, minHeight: 170, paddingTop: 8 }}>
                {moisAffiches.map((m) => (
                  <div key={`${m.annee}-${m.mois}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{m.valeur}</span>
                    <div
                      style={{
                        width: "100%", maxWidth: 38, borderRadius: "8px 8px 2px 2px",
                        height: `${Math.max((m.valeur / maxMois) * 100, m.valeur ? 6 : 2)}%`,
                        background: m.valeur ? "linear-gradient(180deg, #2B6CE0, #0B3FA0)" : "#E5E7EB",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#6B7280", marginTop: 6, textTransform: "capitalize" }}>{m.libelle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Grille secondaire ---------- */}
      {(peutVoirLogistique || peutVoirFinances) && (
        <div className={styles.grilleSecondaire} style={{ alignItems: "start" }}>
          {peutVoirLogistique && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautOr}`}>
              <div className={styles.enteteCarteAvecLien}>
                <h2 className={styles.titreCarte}>{t("reservations_hotels")}</h2>
                <button className={styles.lienVoirTout} onClick={() => navigate("/hebergement")}>{t("voir_tout")}</button>
              </div>
              {hotels.length === 0 ? (
                <p className={styles.etatVide}>{t("aucun_hotel_enregistre")}</p>
              ) : (
                <div className={styles.listeHotels}>
                  {hotels.slice(0, 3).map((h) => {
                    const ratio = h.capacite_totale > 0 ? h.occupants_totaux / h.capacite_totale : 0;
                    const couleurBarre = ratio >= 0.95 ? "#B4433A" : ratio >= 0.75 ? "#C9972B" : "#1F7A4D";
                    return (
                      <div key={h.id} className={styles.ligneHotelModerne} onClick={() => navigate(`/hebergement/${h.id}`)}>
                        <div className={styles.infosHotel}>
                          <p className={styles.nomHotel}>{h.nom}</p>
                          <p className={styles.villeHotel}>{t(`ville_${h.ville}`)}</p>
                        </div>
                        <div className={styles.occupationModerne}>
                          <div className={styles.barreOccupation}>
                            <div
                              className={styles.barreOccupationRemplie}
                              style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: couleurBarre }}
                            />
                          </div>
                          <span className={styles.occupationHotel} style={{ color: couleurBarre }}>
                            {h.occupants_totaux}/{h.capacite_totale}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {peutVoirFinances && resumeFinancier && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautVert}`}>
              <h2 className={styles.titreCarte}>{t("resume_financier")}</h2>
              <div className={styles.blocsFinanceColores}>
                <div className={`${styles.blocFinanceColore} ${styles.blocFinanceOr}`}>
                  <div className={styles.iconeBlocFinance}><Wallet size={18} /></div>
                  <div>
                    <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_general).toLocaleString("fr-FR")}</p>
                    <p className={styles.labelFinance}>{t("total_general_court")} (GNF)</p>
                  </div>
                </div>
                <div className={`${styles.blocFinanceColore} ${styles.blocFinanceVert}`}>
                  <div className={styles.iconeBlocFinance}><TrendingUp size={18} /></div>
                  <div>
                    <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_mois_courant).toLocaleString("fr-FR")}</p>
                    <p className={styles.labelFinance}>{t("ce_mois")} (GNF)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Dettes & créances ouvertes (toujours global) ---------- */}
      {peutVoirFinances && (dettesOuvertes.length > 0 || creancesOuvertes.length > 0) && (
        <div className={styles.grilleSecondaire} style={{ alignItems: "start" }}>
          <div className={`${styles.cartePrincipale} ${styles.carteAccentRouge}`}>
            <div className={styles.enteteCarteAvecLien}>
              <h2 className={styles.titreCarte}>
                <span className={styles.iconeCercleModerne} style={{ backgroundColor: "#B4433A18", color: "#B4433A" }}>
                  <UserX size={15} />
                </span>
                {t("dettes_non_soldees")} ({dettesOuvertes.length})
              </h2>
              <button className={styles.lienVoirTout} onClick={() => navigate("/comptabilite/finances/dette")}>{t("voir_tout")}</button>
            </div>
            <p className={styles.montantAccent} style={{ color: "#B4433A" }}>{formaterMontantsNonNuls(dettesOuvertesParDevise)}</p>
          </div>

          <div className={`${styles.cartePrincipale} ${styles.carteAccentVert}`}>
            <div className={styles.enteteCarteAvecLien}>
              <h2 className={styles.titreCarte}>
                <span className={styles.iconeCercleModerne} style={{ backgroundColor: "#1F7A4D18", color: "#1F7A4D" }}>
                  <UserPlus size={15} />
                </span>
                {t("creances_non_soldees")} ({creancesOuvertes.length})
              </h2>
              <button className={styles.lienVoirTout} onClick={() => navigate("/comptabilite/finances/creance")}>{t("voir_tout")}</button>
            </div>
            <p className={styles.montantAccent} style={{ color: "#1F7A4D" }}>{formaterMontantsNonNuls(creancesOuvertesParDevise)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Cartes de même hauteur dans une même ligne (agences / inscripteurs / mois)
const styleCarteEgale = { display: "flex", flexDirection: "column", boxSizing: "border-box", height: "100%" };

const stylePastilleHero = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
  color: "#fff", background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(6px)",
};

// Petit bloc de chiffre clé affiché dans le bandeau d'accueil
function ChiffreHero({ icone: Icone, valeur, libelle }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 14, color: "#fff",
        background: "rgba(15,23,42,0.55)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
      }}
    >
      <Icone size={18} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} />
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{valeur}</div>
        <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap" }}>{libelle}</div>
      </div>
    </div>
  );
}

const STYLE_CARTES = `
.bvg-cartes-ligne { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
.bvg-cartes-vedette { display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(var(--cols), minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.bvg-cartes-vedette > :first-child { grid-row: span 2; }
.bvg-deux-colonnes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; margin-bottom: 20px; }
.bvg-pile { display: grid; gap: 20px; align-content: start; margin-bottom: 20px; }
.bvg-deux-colonnes > .bvg-pile { margin-bottom: 0; }
.bvg-trois-colonnes { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 20px; align-items: stretch; margin-bottom: 20px; }
@media (max-width: 1100px) {
  .bvg-trois-colonnes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .bvg-deux-colonnes, .bvg-trois-colonnes { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 1000px) {
  .bvg-cartes-ligne, .bvg-cartes-vedette { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bvg-cartes-vedette > :first-child { grid-row: auto; grid-column: span 2; }
}
@media (max-width: 520px) {
  .bvg-cartes-ligne, .bvg-cartes-vedette { grid-template-columns: minmax(0, 1fr); }
  .bvg-cartes-vedette > :first-child { grid-column: auto; }
}
`;

// Range les cartes sans case vide : "vedette" (1 grande + grille) ou deux lignes équilibrées.
function DispositionCartes({ cartes }) {
  const n = cartes.length;
  if (n === 0) return null;
  const rend = (c, grande) => <CarteStat key={c.cle} {...c} grande={grande} />;

  if (DISPOSITION_CARTES === "vedette" && n >= 3 && (n - 1) % 2 === 0) {
    const reste = cartes.slice(1);
    return (
      <div className="bvg-cartes-vedette" style={{ "--cols": reste.length / 2 }}>
        {rend(cartes[0], true)}
        {reste.map((c) => rend(c, false))}
      </div>
    );
  }

  const lignes = n <= 4 ? [cartes] : [cartes.slice(0, Math.ceil(n / 2)), cartes.slice(Math.ceil(n / 2))];
  return (
    <>
      {lignes.map((ligne, i) => (
        <div key={i} className="bvg-cartes-ligne" style={{ "--cols": ligne.length }}>
          {ligne.map((c) => rend(c, false))}
        </div>
      ))}
    </>
  );
}

function pourcentage(valeur, total) {
  return total ? Math.round((valeur / total) * 1000) / 10 : 0;
}

function stylePuce(couleur) {
  return {
    background: `${couleur}16`, color: couleur, border: `1px solid ${couleur}33`,
    borderRadius: 999, padding: "3px 11px", fontSize: 12, fontWeight: 600,
  };
}

// Anneau avec le total au centre.
// Si "donneesInterieur" est fourni (ex. Hajj / Oumra), un second anneau plein est dessiné à l'intérieur.
function DonutCentre({ donnees, total, libelleTotal, hauteur = 200, donneesInterieur = null }) {
  const donneesNonVides = donnees.filter((d) => d.valeur > 0);
  const interieur = donneesInterieur ? donneesInterieur.filter((d) => d.valeur > 0) : null;
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={hauteur}>
        <PieChart>
          <Pie
            data={donneesNonVides} dataKey="valeur" nameKey="libelle"
            innerRadius={interieur ? "72%" : "58%"} outerRadius="92%" paddingAngle={2} stroke="none"
          >
            {donneesNonVides.map((d) => <Cell key={d.cle} fill={d.couleur} />)}
          </Pie>
          {interieur && (
            <Pie data={interieur} dataKey="valeur" nameKey="libelle" innerRadius="46%" outerRadius="66%" paddingAngle={3} stroke="none">
              {interieur.map((d) => <Cell key={d.cle} fill={d.couleur} />)}
            </Pie>
          )}
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{libelleTotal}</span>
      </div>
    </div>
  );
}

// Lignes colorées : pastille, libellé, barre proportionnelle, effectif et pourcentage.
function BarresRepartition({ lignes, total }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {lignes.map((l) => {
        const part = pourcentage(l.valeur, total);
        return (
          <div key={l.cle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151", minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.couleur, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.libelle}
                  {l.sousTexte && <span style={{ marginLeft: 8, fontSize: 11, color: "#9CA3AF" }}>{l.sousTexte}</span>}
                </span>
              </span>
              <span style={{ whiteSpace: "nowrap" }}>
                <strong style={{ color: l.couleur }}>{l.valeur}</strong>
                <span style={{ color: "#9CA3AF", marginLeft: 6 }}>{part} %</span>
              </span>
            </div>
            <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, marginTop: 5, overflow: "hidden" }}>
              <div style={{ width: `${part}%`, height: "100%", background: l.couleur, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CarteStat({ icone: Icone, chiffre, label, couleur, onClick, grande }) {
  const hex = COULEURS_CARTE[couleur] || "#6B6659";
  return (
    <div
      className={styles.carteStatModerne}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        background: `linear-gradient(150deg, ${hex}14, ${hex}05 65%)`,
        borderColor: `${hex}28`,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <Icone className={styles.iconeFantomeStat} style={{ color: hex }} strokeWidth={1.4} />
      <div className={styles.iconeCercleStat} style={{ backgroundColor: hex }}>
        <Icone size={17} color="#fff" strokeWidth={2} />
      </div>
      <p className={styles.chiffreStat} style={grande ? { color: hex, fontSize: 46, lineHeight: 1.1 } : { color: hex }}>{chiffre}</p>
      <p className={styles.labelStat}>{label}</p>
      {onClick && <ArrowUpRight size={15} className={styles.flecheStat} style={{ color: hex }} />}
    </div>
  );
}

export default Dashboard;