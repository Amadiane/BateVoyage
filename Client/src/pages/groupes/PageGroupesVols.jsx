import { useState } from "react";
import { useTranslation } from "react-i18next";
import OngletGroupes from "./OngletGroupes";
import OngletVols from "./OngletVols";
import styles from "../../theme/pages/groupes/PageGroupesVols.module.css";

function PageGroupesVols() {
  const { t } = useTranslation();
  const [vue, setVue] = useState("groupes");

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_groupes")}</h1>

      <div className={styles.ongletsVue}>
        <button className={vue === "groupes" ? styles.ongletActif : styles.onglet} onClick={() => setVue("groupes")}>
          {t("groupes")}
        </button>
        <button className={vue === "vols" ? styles.ongletActif : styles.onglet} onClick={() => setVue("vols")}>
          {t("vols")}
        </button>
      </div>

      {vue === "groupes" ? <OngletGroupes /> : <OngletVols />}
    </div>
  );
}

export default PageGroupesVols;