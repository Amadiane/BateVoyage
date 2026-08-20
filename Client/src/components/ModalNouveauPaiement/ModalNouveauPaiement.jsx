import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { paiementService } from "../../services/paiementService";
import styles from "../../theme/components/ModalNouveauPaiement.module.css";

function ModalNouveauPaiement({ pelerinId, paiementExistant, onFermer, onEnregistre }) {
  const { t } = useTranslation();
  const modeEdition = Boolean(paiementExistant);

  const [montant, setMontant] = useState(paiementExistant?.montant || "");
  const [modePaiement, setModePaiement] = useState(paiementExistant?.mode_paiement || "");
  const [datePaiement, setDatePaiement] = useState(
    paiementExistant?.date_paiement || new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState(paiementExistant?.reference || "");
  const [scanRecu, setScanRecu] = useState(null);
  const [notes, setNotes] = useState(paiementExistant?.notes || "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const formData = new FormData();
      if (!modeEdition) formData.append("pelerin", pelerinId);
      formData.append("montant", montant);
      formData.append("mode_paiement", modePaiement);
      formData.append("date_paiement", datePaiement);
      if (reference) formData.append("reference", reference);
      formData.append("notes", notes || "");
      if (scanRecu) formData.append("scan_recu", scanRecu);

      if (modeEdition) {
        await paiementService.modifier(paiementExistant.id, formData);
      } else {
        await paiementService.creer(formData);
      }
      onEnregistre();
      onFermer();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.superposition} onClick={onFermer}>
      <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={styles.entete}>
          <h2 className={styles.titre}>{modeEdition ? t("modifier_paiement") : t("nouveau_paiement")}</h2>
          <button className={styles.boutonFermer} onClick={onFermer}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formulaire}>
          <div className={styles.champ}>
            <label>{t("montant")}</label>
            <input type="number" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required />
          </div>

          <div className={styles.champ}>
            <label>{t("mode_paiement")}</label>
            <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} required>
              <option value="">—</option>
              <option value="especes">{t("mode_especes")}</option>
              <option value="orange_money">{t("mode_orange_money")}</option>
              <option value="virement">{t("mode_virement")}</option>
            </select>
          </div>

          <div className={styles.champ}>
            <label>{t("date_paiement")}</label>
            <input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} required />
          </div>

          <div className={styles.champ}>
            <label>{t("reference_transaction")}</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t("si_applicable")} />
          </div>

          <div className={styles.champ}>
            <label>{t("scan_recu_versement")}</label>
            {modeEdition && paiementExistant.scan_recu && !scanRecu && (
              <p className={styles.documentExistant}>✓ {t("document_deja_enregistre")}</p>
            )}
            <input type="file" accept="image/*,.pdf" onChange={(e) => setScanRecu(e.target.files[0])} />
          </div>

          <div className={styles.champ}>
            <label>{t("notes")}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {erreur && <p className={styles.erreur}>{erreur}</p>}

          <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>
            {envoi ? t("enregistrement") : t("enregistrer")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalNouveauPaiement;