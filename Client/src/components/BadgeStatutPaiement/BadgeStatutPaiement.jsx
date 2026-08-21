import { useTranslation } from "react-i18next";
import styles from "../../theme/components/BadgeStatutPaiement.module.css";

function BadgeStatutPaiement({ statut }) {
  const { t } = useTranslation();
  if (!statut || statut === "normal" || statut === "indetermine" || statut === "archive") return null;

  return (
    <span className={`${styles.badge} ${styles["statut_" + statut]}`}>
      {t(`statut_paiement_${statut}`)}
    </span>
  );
}

export default BadgeStatutPaiement;