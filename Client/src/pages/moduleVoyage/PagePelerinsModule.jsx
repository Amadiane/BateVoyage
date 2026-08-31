import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, ListChecks } from "lucide-react";
import styles from "../../theme/pages/moduleVoyage/PagePelerinsModule.module.css";

function PagePelerinsModule({ typeVoyage, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>
        ← {t("retour")}
      </button>

      <h1 className={styles.titre}>{t("sous_module_pelerins")}</h1>

      <div className={styles.grilleActions}>
        <button
          className={styles.carteAction}
          onClick={() => navigate(`/pelerins/nouveau?type=${typeVoyage}`)}
        >
          <UserPlus size={28} className={styles.icone} />
          <span className={styles.libelle}>{t("nouveau_pelerin")}</span>
        </button>

        <button
          className={styles.carteAction}
          onClick={() => navigate(`${basePath}/pelerins/liste`)}
        >
          <ListChecks size={28} className={styles.icone} />
          <span className={styles.libelle}>{t("liste_pelerins")}</span>
        </button>
      </div>
    </div>
  );
}

export default PagePelerinsModule;