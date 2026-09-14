import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decaissementService } from "../../services/decaissementService";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

function PageEncaissement({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    decaissementService.obtenirEncaissements(activite).then(({ data }) => {
      setPaiements(data.paiements);
      setTotal(data.total);
      setChargement(false);
    });
  }, [activite]);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("encaissements")}</h1>
      </div>

      <div className={styles.conteneurRecap}>
        <table className={styles.tableauRecap}>
          <thead>
            <tr><th>{t("total_encaisse")}</th></tr>
          </thead>
          <tbody>
            <tr className={styles.ligneTotalRecap}>
              <td>{total.toLocaleString("fr-FR")} GNF</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className={styles.sousTitreListe}>{t("historique_encaissements")}</h2>
      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("recu")}</th>
              <th>{t("pelerin")}</th>
              <th>{t("mode_paiement_label")}</th>
              <th>{t("montant")}</th>
            </tr>
          </thead>
          <tbody>
            {paiements.length === 0 && <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {paiements.map((p) => (
              <tr key={p.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${p.pelerin_numero_id}`)}>
                <td>{p.date_paiement}</td>
                <td className={styles.cellCategorie}>{p.numero_recu}</td>
                <td>{p.pelerin_nom} ({p.pelerin_numero_id})</td>
                <td>{p.mode_paiement_display}</td>
                <td className={styles.cellMontantListe}>{parseFloat(p.montant).toLocaleString("fr-FR")} GNF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PageEncaissement;