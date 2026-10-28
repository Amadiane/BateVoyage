import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decaissementService } from "../../services/decaissementService";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

function PageBeneficeGlobal({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saisons, setSaisons] = useState([]);
  const [saisonSelectionnee, setSaisonSelectionnee] = useState(null);
  const [donnees, setDonnees] = useState(null);
  const [observation, setObservation] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrementObs, setEnregistrementObs] = useState(false);
  const [messageEnregistrement, setMessageEnregistrement] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = async (idSaison) => {
    setErreur("");
    if (!idSaison) {
      setDonnees(null);
      setObservation("");
      return;
    }
    try {
      const { data } = await decaissementService.obtenirBeneficeGlobal(activite, idSaison);
      setDonnees(data);
      setObservation(data.observation || "");
    } catch (err) {
      setErreur(t("erreur_chargement_donnees"));
      setDonnees(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setChargement(true);
      const { data } = await decaissementService.listerSaisons(activite);
      setSaisons(data);
      const saisonActive = data.find((s) => s.est_active);
      const parDefaut = (saisonActive || data[0])?.id || null;
      setSaisonSelectionnee(parDefaut);
      await charger(parDefaut);
      setChargement(false);
    };
    init();
  }, [activite]);

  const changerSaison = async (id) => {
    setSaisonSelectionnee(id);
    setChargement(true);
    await charger(id);
    setChargement(false);
  };

  const enregistrerObservation = async () => {
    if (!saisonSelectionnee) return;
    setEnregistrementObs(true);
    setMessageEnregistrement("");
    try {
      await decaissementService.enregistrerObservationBeneficeGlobal(saisonSelectionnee, observation);
      setMessageEnregistrement(t("observation_enregistree"));
      setTimeout(() => setMessageEnregistrement(""), 3000);
    } catch {
      setMessageEnregistrement(t("erreur_enregistrement"));
    } finally {
      setEnregistrementObs(false);
    }
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("benefice_global")}</h1>
        {saisons.length > 0 && (
          <select value={saisonSelectionnee || ""} onChange={(e) => changerSaison(Number(e.target.value))} className={styles.selectAnnee}>
            {saisons.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        )}
      </div>

      {saisons.length === 0 && <p className={styles.etatVide}>{t("aucune_saison")}</p>}

      {erreur && <p className={styles.erreur}>{erreur}</p>}

      {donnees && (
        <div className={styles.conteneurRecap}>
          <table className={styles.tableauRecap}>
            <thead>
              <tr>
                <th>{t("designation")}</th>
                <th>GNF</th>
                <th>USD</th>
                <th>SAR</th>
              </tr>
            </thead>
            <tbody>
              {donnees.lignes.map((l) => (
                <tr key={l.cle} className={l.cle === "benefice_reel" ? styles.ligneTotalRecap : ""}>
                  <td className={styles.cellCategorie}>
                    {l.designation}
                    {l.details && l.details.length > 0 && (
                      <div style={{ marginTop: 6, display: "grid", gap: 2 }}>
                        {l.details.map((d) => (
                          <div key={d.libelle} style={{ fontSize: 12, fontWeight: 400, color: "#6B7280", display: "flex", justifyContent: "space-between", gap: 12, maxWidth: 360 }}>
                            <span>— {d.libelle}</span>
                            <span>{d.valeurs.gnf.toLocaleString("fr-FR")} GNF</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {l.avertissement && <div className={styles.avertissementLigne}>⚠️ {l.avertissement}</div>}
                  </td>
                  <td className={styles.cellMontant}>{l.valeurs.gnf.toLocaleString("fr-FR")}</td>
                  <td className={styles.cellMontant}>{l.valeurs.usd.toLocaleString("fr-FR")}</td>
                  <td className={styles.cellMontant}>{l.valeurs.sar.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {donnees.dettes_associes && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
              ℹ️ {t("dettes_associes_info", "Dettes non soldées des associés")} :{" "}
              <strong style={{ color: "#374151" }}>
                {donnees.dettes_associes.gnf.toLocaleString("fr-FR")} GNF · {donnees.dettes_associes.usd.toLocaleString("fr-FR")} USD · {donnees.dettes_associes.sar.toLocaleString("fr-FR")} SAR
              </strong>
              <br />
              {t("dettes_associes_precision", "Elles sont déduites de la part de chaque associé dans « Bénéfices individuels » et ne sont pas comprises dans le bénéfice réel ci-dessus.")}
            </p>
          )}
        </div>
      )}

      {saisonSelectionnee && (
        <div className={styles.champ} style={{ marginTop: 24 }}>
          <label>{t("observation")}</label>
          <textarea
            rows={3}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder={t("observation_placeholder")}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <button className={styles.boutonPrincipal} onClick={enregistrerObservation} disabled={enregistrementObs}>
              {enregistrementObs ? t("enregistrement") : t("enregistrer")}
            </button>
            {messageEnregistrement && <span className={styles.messageConfirmation}>{messageEnregistrement}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default PageBeneficeGlobal;