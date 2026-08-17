import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { activiteService } from "../../services/activiteService";
import styles from "../../theme/pages/activite/PageJournalActivite.module.css";

function PageJournalActivite() {
  const { t } = useTranslation();
  const [entrees, setEntrees] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    activiteService.obtenirJournalGlobal().then(({ data }) => {
      setEntrees(data);
      setChargement(false);
    });
  }, []);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_journal")}</h1>
      <p className={styles.sousTitre}>{t("journal_description")}</p>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("action")}</th>
              <th>{t("modele")}</th>
              <th>{t("element")}</th>
              <th>{t("par")}</th>
              <th>{t("date_heure")}</th>
            </tr>
          </thead>
          <tbody>
            {entrees.length === 0 && (
              <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_historique")}</td></tr>
            )}
            {entrees.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className={`${styles.badgeAction} ${styles["action_" + e.action_libelle]}`}>
                    {t(`action_${e.action_libelle}`)}
                  </span>
                </td>
                <td>{e.modele_libelle}</td>
                <td className={styles.objetRepr}>{e.object_repr}</td>
                <td>{e.utilisateur_nom}</td>
                <td className={styles.dateCell}>{new Date(e.timestamp).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PageJournalActivite;