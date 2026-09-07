import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "../../theme/components/ModalConfirmation.module.css";

function ModalConfirmation({ titre, message, onConfirmer, onAnnuler, danger = true }) {
  const { t } = useTranslation();

  return (
    <div className={styles.superposition} onClick={onAnnuler}>
      <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.iconeCercle} ${danger ? styles.cercleDanger : styles.cercleNeutre}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 className={styles.titre}>{titre}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.boutonAnnuler} onClick={onAnnuler}>{t("annuler")}</button>
          <button className={danger ? styles.boutonConfirmerDanger : styles.boutonConfirmer} onClick={onConfirmer}>
            {t("confirmer")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmation;