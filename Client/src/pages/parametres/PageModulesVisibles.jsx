import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { configurationService } from "../../services/configurationService";
import styles from "../../theme/pages/parametres/PageModulesVisibles.module.css";

function PageModulesVisibles() {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    configurationService.listerModules().then(({ data }) => {
      setModules(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const basculer = async (module) => {
  setModules((liste) => liste.map((m) => (m.id === module.id ? { ...m, actif: !m.actif } : m)));
  await configurationService.modifierModule(module.id, { actif: !module.actif });
  window.dispatchEvent(new Event("modules-systeme-modifies"));
};

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <h1 className={styles.titre}>{t("modules_visibles_titre")}</h1>
      <p className={styles.sousTitre}>{t("modules_visibles_description")}</p>

      <div className={styles.liste}>
        {modules.map((m) => (
          <div key={m.id} className={styles.ligne}>
            <span className={styles.nomModule}>{m.nom_affiche}</span>
            <button
              className={`${styles.interrupteur} ${m.actif ? styles.interrupteurActif : ""}`}
              onClick={() => basculer(m)}
            >
              <span className={styles.bouleInterrupteur} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageModulesVisibles;