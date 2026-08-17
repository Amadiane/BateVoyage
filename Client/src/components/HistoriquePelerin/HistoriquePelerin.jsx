import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import styles from "../../theme/components/HistoriquePelerin.module.css";

function HistoriquePelerin({ pelerinId, onFermer }) {
  const { t } = useTranslation();
  const [entrees, setEntrees] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    pelerinService.obtenirHistorique(pelerinId).then(({ data }) => {
      setEntrees(data);
      setChargement(false);
    });
  }, [pelerinId]);

  return (
    <div className={styles.superposition} onClick={onFermer}>
      <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={styles.entete}>
          <h2 className={styles.titre}>{t("historique_du_dossier")}</h2>
          <button className={styles.boutonFermer} onClick={onFermer}>✕</button>
        </div>

        <div className={styles.contenu}>
          {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
          {!chargement && entrees.length === 0 && (
            <p className={styles.etatVide}>{t("aucun_historique")}</p>
          )}

          {!chargement && entrees.map((entree) => (
            <div key={entree.id} className={styles.entree}>
              <div className={styles.ligneEntete}>
                <span className={`${styles.badgeAction} ${styles["action_" + entree.action_libelle]}`}>
                  {t(`action_${entree.action_libelle}`)}
                </span>
                <span className={styles.dateEntree}>
                  {new Date(entree.timestamp).toLocaleString("fr-FR")}
                </span>
              </div>
              <p className={styles.parQui}>
                {t("par")} <strong>{entree.utilisateur_nom}</strong>
              </p>

              {entree.action_libelle === "modification" && Object.keys(entree.changements).length > 0 && (
                <table className={styles.tableauChangements}>
                  <tbody>
                    {Object.entries(entree.changements).map(([champ, valeurs]) => (
                      <tr key={champ}>
                        <td className={styles.nomChamp}>{champ}</td>
                        <td className={styles.ancienneValeur}>{String(valeurs[0] ?? "—")}</td>
                        <td className={styles.fleche}>→</td>
                        <td className={styles.nouvelleValeur}>{String(valeurs[1] ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HistoriquePelerin;