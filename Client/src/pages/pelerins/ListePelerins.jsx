import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import BadgeStatutPaiement from "../../components/BadgeStatutPaiement/BadgeStatutPaiement";
import styles from "../../theme/pages/pelerins/ListePelerins.module.css";

function ListePelerins() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState("");

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (recherche) params.search = recherche;
      if (filtreStatut) params.statut = filtreStatut;
      const { data } = await pelerinService.lister(params);
      setPelerins(data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [recherche, filtreStatut]);

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

  const pelerinsAffiches = filtreStatutPaiement
    ? pelerins.filter((p) => p.statut_paiement === filtreStatutPaiement)
    : pelerins;

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("pelerins")}</h1>
          <p className={styles.sousTitre}>{pelerinsAffiches.length} {t("dossiers_enregistres")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => navigate("/pelerins/nouveau")}>
          + {t("nouveau_pelerin")}
        </button>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={9} className={styles.etatVide}>{t("chargement")}</td></tr>
            )}
            {!chargement && pelerinsAffiches.length === 0 && (
              <tr><td colSpan={9} className={styles.etatVide}>{t("aucun_pelerin")}</td></tr>
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
                <td>
                  <BadgeStatutPaiement statut={p.statut_paiement} />
                </td>
                <td className={styles.cellInscripteur}>{p.inscripteur_nom || "—"}</td>
                <td className={styles.cellActions} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/pelerins/${p.id}/modifier`)} title={t("modifier")}>
                    ✎
                  </button>
                  <button onClick={(e) => telechargerFiche(p, e)} title={t("telecharger_fiche")}>
                    ⬇
                  </button>
                  <button onClick={(e) => supprimer(p.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}>
                    ✕
                  </button>
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