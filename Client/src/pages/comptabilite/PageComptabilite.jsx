import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { comptabiliteService } from "../../services/comptabiliteService";
import OngletBonsSortie from "./OngletBonsSortie";
import OngletDepenses from "./OngletDepenses";
import OngletDettesFournisseurs from "./OngletDettesFournisseurs";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

function PageComptabilite() {
  const { t } = useTranslation();
  const [resume, setResume] = useState(null);
  const [activiteActive, setActiviteActive] = useState("hajj");
  const [ongletActif, setOngletActif] = useState("bons_sortie");

  const chargerResume = () => {
    comptabiliteService.obtenirResume({ activite: activiteActive }).then(({ data }) => setResume(data));
  };

  useEffect(() => { chargerResume(); }, [activiteActive]);

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_comptabilite")}</h1>
      <p className={styles.sousTitre}>{t("comptabilite_description")}</p>

      <div className={styles.ongletsActivite}>
        <button className={activiteActive === "hajj" ? styles.activiteActive : styles.activite} onClick={() => setActiviteActive("hajj")}>
          {t("menu_hajj")}
        </button>
        <button className={activiteActive === "oumra" ? styles.activiteActive : styles.activite} onClick={() => setActiviteActive("oumra")}>
          {t("menu_oumra")}
        </button>
        <button className={activiteActive === "general" ? styles.activiteActive : styles.activite} onClick={() => setActiviteActive("general")}>
          {t("activite_generale")}
        </button>
      </div>

      {resume && (
        <div className={styles.cartesResume}>
          <button className={`${styles.carteResume} ${styles.carteRouge}`} onClick={() => setOngletActif("bons_sortie")}>
            <span className={styles.chiffreResume}>{parseFloat(resume.total_creances_en_attente).toLocaleString("fr-FR")} GNF</span>
            <span className={styles.labelResume}>{t("creances_en_attente")} ({resume.nombre_creances_en_attente})</span>
          </button>
          <button className={`${styles.carteResume} ${styles.carteOrange}`} onClick={() => setOngletActif("depenses")}>
            <span className={styles.chiffreResume}>{parseFloat(resume.total_depenses).toLocaleString("fr-FR")} GNF</span>
            <span className={styles.labelResume}>{t("total_depenses")}</span>
          </button>
          <button className={`${styles.carteResume} ${styles.carteViolette}`} onClick={() => setOngletActif("dettes")}>
            <span className={styles.chiffreResume}>{parseFloat(resume.total_dettes_fournisseurs).toLocaleString("fr-FR")} GNF</span>
            <span className={styles.labelResume}>{t("dettes_fournisseurs")} ({resume.nombre_dettes_fournisseurs})</span>
          </button>
        </div>
      )}

      <div className={styles.ongletsVue}>
        <button className={ongletActif === "bons_sortie" ? styles.ongletActif : styles.onglet} onClick={() => setOngletActif("bons_sortie")}>
          {t("bons_sortie")}
        </button>
        <button className={ongletActif === "depenses" ? styles.ongletActif : styles.onglet} onClick={() => setOngletActif("depenses")}>
          {t("depenses")}
        </button>
        <button className={ongletActif === "dettes" ? styles.ongletActif : styles.onglet} onClick={() => setOngletActif("dettes")}>
          {t("dettes_fournisseurs")}
        </button>
      </div>

      {ongletActif === "bons_sortie" && <OngletBonsSortie activite={activiteActive} onChange={chargerResume} />}
      {ongletActif === "depenses" && <OngletDepenses activite={activiteActive} onChange={chargerResume} />}
      {ongletActif === "dettes" && <OngletDettesFournisseurs activite={activiteActive} onChange={chargerResume} />}
    </div>
  );
}

export default PageComptabilite;