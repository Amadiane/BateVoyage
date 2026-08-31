import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Package, FileCheck2, Plane, Hotel, Bus, UsersRound, Wallet } from "lucide-react";
import styles from "../../theme/pages/moduleVoyage/PageModuleVoyage.module.css";

const SOUS_MODULES = [
  { cle: "pelerins", icone: Users, actif: true },
  { cle: "forfaits", icone: Package, actif: false },
  { cle: "visa_doc", icone: FileCheck2, actif: false },
  { cle: "vols", icone: Plane, actif: false },
  { cle: "hebergement", icone: Hotel, actif: false },
  { cle: "transport", icone: Bus, actif: false },
  { cle: "groupes", icone: UsersRound, actif: false },
  { cle: "finances", icone: Wallet, actif: false },
];

function PageModuleVoyage({ typeVoyage, basePath, titreCle }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className={styles.titre}>{t(titreCle)}</h1>
      <p className={styles.sousTitre}>{t("choisir_sous_module")}</p>

      <div className={styles.grilleSousModules}>
        {SOUS_MODULES.map((m) => {
          const Icone = m.icone;
          return (
            <button
              key={m.cle}
              className={`${styles.carteSousModule} ${!m.actif ? styles.carteDesactivee : ""}`}
              disabled={!m.actif}
              onClick={() => m.actif && navigate(`${basePath}/${m.cle}`)}
            >
              <Icone size={24} className={styles.icone} />
              <span className={styles.libelle}>{t(`sous_module_${m.cle}`)}</span>
              {!m.actif && <span className={styles.badgeBientot}>{t("bientot")}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageModuleVoyage;