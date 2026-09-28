import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { exporterTableauExcel, exporterTableauPdf } from "../../utils/exportTableau";
import styles from "../../theme/components/export/BoutonExporter.module.css";

/**
 * Bouton "Exporter" réutilisable pour n'importe quel tableau de Comptabilité.
 */
export default function BoutonExporter({ titre, sousTitre, colonnes, lignes, totaux, disabled }) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const conteneurRef = useRef(null);

  useEffect(() => {
    function fermerSiExterieur(e) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  const auMoinsUneLigne = Array.isArray(lignes) && lignes.length > 0;

  async function gererExportExcel() {
    setOuvert(false);
    setErreur("");
    setEnCours(true);
    try {
      await exporterTableauExcel({ titre, sousTitre, colonnes, lignes, totaux });
    } catch (e) {
      setErreur(t("export_erreur", "L'export a échoué. Réessayez."));
    } finally {
      setEnCours(false);
    }
  }

  function gererExportPdf() {
    setOuvert(false);
    setErreur("");
    try {
      exporterTableauPdf({ titre, sousTitre, colonnes, lignes, totaux });
    } catch (e) {
      if (e && e.message === "POPUP_BLOQUEE") {
        setErreur(t("export_popup_bloquee", "Autorisez les pop-up pour imprimer / exporter en PDF."));
      } else {
        setErreur(t("export_erreur", "L'export a échoué. Réessayez."));
      }
    }
  }

  return (
    <div className={styles.conteneur} ref={conteneurRef}>
      <button
        type="button"
        className={styles.boutonPrincipal}
        onClick={() => setOuvert((v) => !v)}
        disabled={disabled || !auMoinsUneLigne || enCours}
        title={!auMoinsUneLigne ? t("export_aucune_donnee", "Aucune donnée à exporter") : undefined}
      >
        {enCours ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <svg className={styles.icone} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span>{t("exporter", "Exporter")}</span>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {ouvert && (
        <div className={styles.menu} role="menu">
          <button type="button" className={styles.optionMenu} onClick={gererExportExcel} role="menuitem">
            <span className={styles.puceExcel}>XLS</span>
            {t("export_excel", "Excel (.xlsx)")}
          </button>
          <button type="button" className={styles.optionMenu} onClick={gererExportPdf} role="menuitem">
            <span className={styles.pucePdf}>PDF</span>
            {t("export_pdf", "PDF / Imprimer")}
          </button>
        </div>
      )}

      {erreur && <div className={styles.messageErreur}>{erreur}</div>}
    </div>
  );
}