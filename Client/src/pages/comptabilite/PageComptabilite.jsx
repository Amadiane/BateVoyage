import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, Receipt, TrendingDown, Building2 } from "lucide-react";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

function PageComptabilite({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const boutons = [
    { cle: "decaissement", label: t("decaissements"), icone: TrendingDown, couleur: "rouge" },
    { cle: "bons-sortie", label: t("bons_sortie"), icone: Receipt, couleur: "orange" },
    { cle: "depenses", label: t("depenses"), icone: Wallet, couleur: "violet" },
    { cle: "dettes", label: t("dettes_fournisseurs"), icone: Building2, couleur: "bleu" },
  ];

  return (
    <div>
      {basePath && (
        <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>
      )}

      <h1 className={styles.titre}>{t("menu_comptabilite")}</h1>
      <p className={styles.sousTitre}>{t("comptabilite_description")}</p>

      <div className={styles.grilleBoutons}>
        {boutons.map((b) => {
          const Icone = b.icone;
          return (
            <button
              key={b.cle}
              className={`${styles.carteBouton} ${styles["bordure_" + b.couleur]}`}
              onClick={() => navigate(`${basePath}/finances/${b.cle}`)}
            >
              <div className={`${styles.iconeCercle} ${styles["cercle_" + b.couleur]}`}>
                <Icone size={26} />
              </div>
              <span className={styles.libelleBouton}>{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageComptabilite;