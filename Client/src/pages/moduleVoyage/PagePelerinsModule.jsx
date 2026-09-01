import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, ListChecks } from "lucide-react";
import styles from "../../theme/pages/moduleVoyage/PagePelerinsModule.module.css";

function PagePelerinsModule({ typeVoyage, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page} style={{ position: "relative" }}>
      <button className={styles.retour} onClick={() => navigate(basePath)}>
        ← {t("retour")}
      </button>

      <h1 className={styles.titre}>{t("sous_module_pelerins")}</h1>

      <div className={styles.grilleActions}>
        <button
          className={`${styles.carteAction} ${styles.bordure_bleu}`}
          onClick={() => navigate(`/pelerins/nouveau?type=${typeVoyage}`)}
        >
          <div className={`${styles.iconeCercle} ${styles.cercle_bleu}`}>
            <UserPlus size={32} />
          </div>
          <span className={styles.libelle}>{t("nouveau_pelerin")}</span>
        </button>

        <button
          className={`${styles.carteAction} ${styles.bordure_or}`}
          onClick={() => navigate(`${basePath}/pelerins/liste`)}
        >
          <div className={`${styles.iconeCercle} ${styles.cercle_or}`}>
            <ListChecks size={32} />
          </div>
          <span className={styles.libelle}>{t("liste_pelerins")}</span>
        </button>
      </div>
    </div>
  );
}

export default PagePelerinsModule;