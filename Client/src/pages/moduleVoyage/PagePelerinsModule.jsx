import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, ListChecks } from "lucide-react";
import styles from "../../theme/pages/moduleVoyage/PagePelerinsModule.module.css";

function PagePelerinsModule({ typeVoyage, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <h1 className={styles.titre}>{t("sous_module_pelerins")}</h1>

      <div className={styles.grilleActions}>
        <button
          className={styles.carteAction}
          onClick={() => navigate(`/pelerins/nouveau?type=${typeVoyage}`)}
        >
          <span className={styles.barreHaut} style={{ backgroundColor: "#2B6CE0" }} />
          <div className={styles.iconeCercle} style={{ backgroundColor: "#2B6CE0" }}>
            <UserPlus size={24} />
          </div>
          <span className={styles.libelle}>{t("nouveau_pelerin")}</span>
          <span className={styles.description}>{t("desc_nouveau_pelerin")}</span>
        </button>

        <button
          className={styles.carteAction}
          onClick={() => navigate(`${basePath}/pelerins/liste`)}
        >
          <span className={styles.barreHaut} style={{ backgroundColor: "#C7A44A" }} />
          <div className={styles.iconeCercle} style={{ backgroundColor: "#C7A44A" }}>
            <ListChecks size={24} />
          </div>
          <span className={styles.libelle}>{t("liste_pelerins")}</span>
          <span className={styles.description}>{t("desc_liste_pelerins")}</span>
        </button>
      </div>
    </div>
  );
}

export default PagePelerinsModule;