import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import BadgeStatutPaiement from "../../components/BadgeStatutPaiement/BadgeStatutPaiement";
import QuotaPelerins, { AlerteQuotaAtteint } from "../../components/QuotaPelerins/QuotaPelerins";
import CONFIG from "../../config/config";
import styles from "../../theme/pages/pelerins/ListePelerins.module.css";

const INSCRIPTEURS_HAJJ = [
  "N'famba Ibrahima Kaba",
  "Mohamed Ahmad Diallo",
  "Aboubacar Ahmad Diallo",
  "Nfamba Keïta",
  "Minata Mady Kaba",
  "Boh Kabinet",
  "Hadja Fatou Diallo",
  "Hadja Fanta Oulen",
];

const INSCRIPTEURS_OUMRA = [
  "N'famba Ibrahima Kaba",
  "Mohamed Ahmad Diallo",
  "Aboubacar Ahmad Diallo",
  "Sekou N'bah koita",
  "Souleymane Sacko",
  "Minata Mady Kaba",
];

const ANNEES = [2024, 2025, 2026, 2027];

// Agences proposées dans le filtre (un pèlerin sans agence partenaire est un pèlerin BATE VOYAGE GUINÉE).
const AGENCES = ["BATE VOYAGE GUINÉE", "INTER-DJIGUI", "MANDEN VOYAGE"];

function ListePelerins({ typeVoyageFixe, titreCle, retourPath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreInscripteur, setFiltreInscripteur] = useState("");
  const [filtreGenre, setFiltreGenre] = useState("");
  const [filtreAgence, setFiltreAgence] = useState("");

  // Liste des inscripteurs selon le module (Oumra a sa propre liste)
  const INSCRIPTEURS = typeVoyageFixe === "oumra" ? INSCRIPTEURS_OUMRA : INSCRIPTEURS_HAJJ;

  // Quota d'inscription : uniquement dans les listes Hajj et Oumra
  const activiteQuota = typeVoyageFixe === "pelerinage" ? "hajj" : typeVoyageFixe === "oumra" ? "oumra" : null;
  const [quota, setQuota] = useState(null);
  const [versionQuota, setVersionQuota] = useState(0);
  const [alerteQuota, setAlerteQuota] = useState(false);

  const nouveauPelerin = () => {
    if (quota?.atteint) {
      setAlerteQuota(true);
      return;
    }
    navigate(typeVoyageFixe ? `/pelerins/nouveau?type=${typeVoyageFixe}` : "/pelerins/nouveau");
  };

  // Filtres actifs : utilisés pour la liste ET pour les exports Excel / PDF.
  const construireParams = () => {
    const params = {};
    if (recherche.trim()) params.search = recherche.trim();
    if (filtreStatut) params.statut = filtreStatut;
    if (typeVoyageFixe) params.type_voyage = typeVoyageFixe;
    if (filtreAnnee) params.annee = filtreAnnee;
    if (filtreInscripteur) params.inscripteur = filtreInscripteur;
    if (filtreGenre) params.sexe = filtreGenre;
    if (filtreAgence) params.agence = filtreAgence;
    return params;
  };

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await pelerinService.lister(construireParams());
      setPelerins(data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [recherche, filtreStatut, typeVoyageFixe, filtreAnnee, filtreInscripteur, filtreGenre, filtreAgence]);

  const pelerinsAffiches = filtreStatutPaiement
    ? pelerins.filter((p) => p.statut_paiement === filtreStatutPaiement)
    : pelerins;

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression"))) return;
    await pelerinService.supprimer(id);
    setVersionQuota((v) => v + 1);
    charger();
  };

  const telechargerFiche = (p, e) => {
    e.stopPropagation();
    telechargerFichierProtege(pelerinService.urlFichePdf(p.id), `fiche_${p.numero_id}.pdf`);
  };

  // Les exports reprennent les filtres de la liste (module, recherche, genre, agence...).
  const urlExport = (chemin) => {
    const texte = new URLSearchParams(construireParams()).toString();
    return `${CONFIG.API_PELERINS}${chemin}/${texte ? `?${texte}` : ""}`;
  };

  const exporterExcel = () => {
    telechargerFichierProtege(urlExport("export-excel"), "pelerins_export.xlsx");
  };

  const exporterPdf = () => {
    telechargerFichierProtege(urlExport("export-pdf"), "liste_pelerins.pdf");
  };

  return (
    <div>
      {retourPath && (
        <button className={styles.retour} onClick={() => navigate(retourPath)}>
          ← {t("retour")}
        </button>
      )}

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t(titreCle || "menu_pelerins")}</h1>
          <p className={styles.sousTitre}>{pelerinsAffiches.length} {t("dossiers_enregistres")}</p>
        </div>
        <div className={styles.groupeBoutons}>
          <button className={styles.boutonSecondaire} onClick={exporterExcel}>⬇ Excel</button>
          <button className={styles.boutonSecondaire} onClick={exporterPdf}>⬇ PDF</button>
          <button
            className={styles.boutonPrincipal}
            onClick={nouveauPelerin}
            style={quota?.atteint ? { opacity: 0.6 } : undefined}
          >
            + {t("nouveau_pelerin")}
          </button>
        </div>
      </div>

      {activiteQuota && (
        <QuotaPelerins activite={activiteQuota} onChange={setQuota} version={versionQuota} />
      )}

      {alerteQuota && <AlerteQuotaAtteint onFermer={() => setAlerteQuota(false)} />}

      <div className={styles.barreOutils}>
        <input
          type="text"
          placeholder={t("rechercher_pelerin")}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className={styles.champRecherche}
        />
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_statuts")}</option>
          <option value="inscrit">{t("statut_inscrit")}</option>
          <option value="en_preparation">{t("statut_en_preparation")}</option>
          <option value="valide">{t("statut_valide")}</option>
          <option value="en_voyage">{t("statut_en_voyage")}</option>
          <option value="retourne">{t("statut_retourne")}</option>
          <option value="cloture">{t("statut_cloture")}</option>
        </select>
        <select value={filtreStatutPaiement} onChange={(e) => setFiltreStatutPaiement(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_statuts_paiement")}</option>
          <option value="complet">{t("statut_paiement_complet")}</option>
          <option value="a_surveiller">{t("statut_paiement_a_surveiller")}</option>
          <option value="en_retard">{t("statut_paiement_en_retard")}</option>
        </select>
        <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("toutes_annees")}</option>
          {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtreInscripteur} onChange={(e) => setFiltreInscripteur(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_inscripteurs")}</option>
          {INSCRIPTEURS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filtreGenre} onChange={(e) => setFiltreGenre(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_genres", "Tous les genres")}</option>
          <option value="M">{t("homme", "Homme")}</option>
          <option value="F">{t("femme", "Femme")}</option>
        </select>
        <select value={filtreAgence} onChange={(e) => setFiltreAgence(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("toutes_agences", "Toutes les agences")}</option>
          {AGENCES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("photo")}</th>
              <th>{t("nom_complet")}</th>
              <th>{t("telephone")}</th>
              <th>{t("statut")}</th>
              <th>{t("visa")}</th>
              <th>{t("statut_paiement_label")}</th>
              <th>{t("inscripteur")}</th>
              <th>{t("agence_partenaire")}</th>
              <th>{t("dossier")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={11} className={styles.etatVide}>{t("chargement")}</td></tr>
            )}
            {!chargement && pelerinsAffiches.length === 0 && (
              <tr><td colSpan={11} className={styles.etatVide}>{t("aucun_pelerin")}</td></tr>
            )}
            {!chargement && pelerinsAffiches.map((p) => (
              <tr key={p.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${p.id}`)}>
                <td className={styles.cellId}>{p.numero_id}</td>
                <td>
                  {p.photo ? (
                    <img src={p.photo} alt="" className={styles.miniature} />
                  ) : (
                    <div className={styles.miniaturePlaceholder}>{p.prenom?.[0]}{p.nom?.[0]}</div>
                  )}
                </td>
                <td>{p.prenom} {p.nom}</td>
                <td>{p.telephone}</td>
                <td>
                  <span className={`${styles.badge} ${styles["badge_" + p.statut]}`}>
                    {t(`statut_${p.statut}`)}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles["badgeVisa_" + p.statut_visa]}`}>
                    {t(`visa_${p.statut_visa}`)}
                  </span>
                </td>
                <td><BadgeStatutPaiement statut={p.statut_paiement} /></td>
                <td className={styles.cellInscripteur}>{p.inscripteur || "—"}</td>
                <td>{p.agence_partenaire || "BATE VOYAGE GUINÉE"}</td>
                <td>
                  {p.elements_manquants && p.elements_manquants.length > 0 ? (
                    <span className={styles.badgeIncomplet} title={p.elements_manquants.map((el) => t(`manquant_${el}`)).join(", ")}>
                      ⚠️ {p.elements_manquants.length}
                    </span>
                  ) : (
                    <span className={styles.badgeComplet}>✓</span>
                  )}
                </td>
                <td className={styles.cellActions} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/pelerins/${p.id}/modifier`)} title={t("modifier")}>✎</button>
                  <button onClick={(e) => telechargerFiche(p, e)} title={t("telecharger_fiche")}>⬇</button>
                  <button onClick={(e) => supprimer(p.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListePelerins;