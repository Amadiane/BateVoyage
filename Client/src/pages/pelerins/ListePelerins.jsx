import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import BadgeStatutPaiement from "../../components/BadgeStatutPaiement/BadgeStatutPaiement";
import CONFIG from "../../config/config";
import styles from "../../theme/pages/pelerins/ListePelerins.module.css";

const INSCRIPTEURS = [
  "Nfamba Kaba", "Laye Mady Diallo", "Laye Abou Diallo", "Nfamba Keïta",
  "Minata Mady", "Boh Kabinet", "Hadja Fatou Diallo", "Hadja Fanta Oulen",
];

const ANNEES = [2024, 2025, 2026, 2027];

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

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (recherche) params.search = recherche;
      if (filtreStatut) params.statut = filtreStatut;
      if (typeVoyageFixe) params.type_voyage = typeVoyageFixe;
      if (filtreAnnee) params.annee = filtreAnnee;
      if (filtreInscripteur) params.inscripteur = filtreInscripteur;
      const { data } = await pelerinService.lister(params);
      setPelerins(data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [recherche, filtreStatut, typeVoyageFixe, filtreAnnee, filtreInscripteur]);

  const pelerinsAffiches = filtreStatutPaiement
    ? pelerins.filter((p) => p.statut_paiement === filtreStatutPaiement)
    : pelerins;

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression"))) return;
    await pelerinService.supprimer(id);
    charger();
  };

  const telechargerFiche = (p, e) => {
    e.stopPropagation();
    telechargerFichierProtege(pelerinService.urlFichePdf(p.id), `fiche_${p.numero_id}.pdf`);
  };

  const exporterExcel = () => {
    telechargerFichierProtege(`${CONFIG.API_PELERINS}export-excel/`, "pelerins_export.xlsx");
  };

  const exporterPdf = () => {
    telechargerFichierProtege(`${CONFIG.API_PELERINS}export-pdf/`, "liste_pelerins.pdf");
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
            onClick={() => navigate(typeVoyageFixe ? `/pelerins/nouveau?type=${typeVoyageFixe}` : "/pelerins/nouveau")}
          >
            + {t("nouveau_pelerin")}
          </button>
        </div>
      </div>

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
              <th>{t("dossier")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={10} className={styles.etatVide}>{t("chargement")}</td></tr>
            )}
            {!chargement && pelerinsAffiches.length === 0 && (
              <tr><td colSpan={10} className={styles.etatVide}>{t("aucun_pelerin")}</td></tr>
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