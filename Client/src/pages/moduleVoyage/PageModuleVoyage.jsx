import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Package, FileCheck2, Plane, Hotel, Bus, UsersRound, Wallet } from "lucide-react";
import styles from "../../theme/pages/moduleVoyage/PageModuleVoyage.module.css";

const SOUS_MODULES = [
  { cle: "pelerins", icone: Users, actif: true, couleur: "bleu" },
  { cle: "forfaits", icone: Package, actif: true, couleur: "orange" },
  { cle: "visa_doc", icone: FileCheck2, actif: true, couleur: "or" },
  { cle: "vols", icone: Plane, actif: true, couleur: "violet" },
  { cle: "groupes", icone: UsersRound, actif: true, couleur: "cyan" },
  { cle: "hebergement", icone: Hotel, actif: true, couleur: "vert" },
  { cle: "transport", icone: Bus, actif: true, couleur: "rose" },
  { cle: "finances", icone: Wallet, actif: false, couleur: "rouge" },
];

function PageModuleVoyage({ typeVoyage, basePath, titreCle }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <h1 className={styles.titre}>{t(titreCle)}</h1>
      <p className={styles.sousTitre}>{t("choisir_sous_module")}</p>

      <div className={styles.grilleSousModules}>
        {SOUS_MODULES.map((m) => {
          const Icone = m.icone;
          return (
            <button
              key={m.cle}
              className={`${styles.carteSousModule} ${styles["bordure_" + m.couleur]} ${!m.actif ? styles.carteDesactivee : ""}`}
              disabled={!m.actif}
              onClick={() => m.actif && navigate(`${basePath}/${m.cle}`)}
            >
              <div className={`${styles.iconeCercle} ${styles["cercle_" + m.couleur]}`}>
                <Icone size={30} />
              </div>
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