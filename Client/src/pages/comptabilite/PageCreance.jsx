import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

const VALEURS_INITIALES = {
  date: new Date().toISOString().slice(0, 10), nom: "", prenom: "", montant: "", devise: "GNF",
  adresse: "", telephone: "", mode_paiement: "", notes: "",
};

function PageCreance({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creances, setCreances] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreSoldee, setFiltreSoldee] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [creanceAModifier, setCreanceAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  const charger = () => {
    setChargement(true);
    const params = {};
    if (filtreSoldee !== "") params.soldee = filtreSoldee;
    decaissementService.listerCreances(params).then(({ data }) => {
      setCreances(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [filtreSoldee]);

  const ouvrirNouveau = () => {
    setCreanceAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (c) => {
    setCreanceAModifier(c);
    setValeurs({
      date: c.date, nom: c.nom, prenom: c.prenom, montant: c.montant, devise: c.devise,
      adresse: c.adresse || "", telephone: c.telephone || "", mode_paiement: c.mode_paiement || "", notes: c.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async () => {
    setErreur("");
    if (!valeurs.nom || !valeurs.prenom || !valeurs.montant || !valeurs.date) {
      setErreur(t("champs_obligatoires_manquants"));
      return;
    }
    setEnvoi(true);
    try {
      if (creanceAModifier) {
        await decaissementService.modifierCreance(creanceAModifier.id, valeurs);
      } else {
        await decaissementService.creerCreance(valeurs);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const marquerSoldee = async (c) => {
    await decaissementService.modifierCreance(c.id, { soldee: true });
    charger();
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerCreance(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("creance")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouvelle_creance")}
        </button>
      </div>

      <div className={styles.barreOutils} style={{ marginBottom: 14 }}>
        <select value={filtreSoldee} onChange={(e) => setFiltreSoldee(e.target.value)} className={styles.selectAnnee}>
          <option value="">{t("tous")}</option>
          <option value="false">{t("non_soldee")}</option>
          <option value="true">{t("soldee")}</option>
        </select>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("date")}</th><th>{t("nom_complet")}</th><th>{t("telephone")}</th>
              <th>{t("mode_paiement_label")}</th><th>{t("montant")}</th><th>{t("statut")}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={7} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && creances.length === 0 && <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && creances.map((c) => (
              <tr key={c.id}>
                <td>{c.date}</td>
                <td>{c.prenom} {c.nom}</td>
                <td>{c.telephone || "—"}</td>
                <td>{c.mode_paiement || "—"}</td>
                <td className={styles.cellMontantListe}>{parseFloat(c.montant).toLocaleString("fr-FR")} {c.devise}</td>
                <td>
                  <span className={c.soldee ? styles.badgeVert : styles.badgeRouge}>
                    {c.soldee ? t("soldee") : t("non_soldee")}
                  </span>
                </td>
                <td className={styles.cellActions}>
                  {!c.soldee && <button onClick={() => marquerSoldee(c)} title={t("marquer_soldee")}>✓</button>}
                  <button onClick={() => ouvrirModification(c)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={() => setASupprimer(c)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{creanceAModifier ? t("modifier_creance") : t("nouvelle_creance")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}><label>{t("nom")}</label><input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} /></div>
                <div className={styles.champ}><label>{t("prenom")}</label><input value={valeurs.prenom} onChange={(e) => majChamp("prenom", e.target.value)} /></div>
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}><label>{t("montant")}</label><input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} /></div>
                <div className={styles.champ}>
                  <label>{t("devise")}</label>
                  <select value={valeurs.devise} onChange={(e) => majChamp("devise", e.target.value)}>
                    <option value="GNF">GNF</option><option value="USD">USD</option><option value="SAR">SAR</option>
                  </select>
                </div>
              </div>
              <div className={styles.champ}><label>{t("date")}</label><input type="date" min="2020-01-01" max="2035-12-31" value={valeurs.date} onChange={(e) => majChamp("date", e.target.value)} /></div>
              <div className={styles.champ}><label>{t("adresse")}</label><input value={valeurs.adresse} onChange={(e) => majChamp("adresse", e.target.value)} /></div>
              <div className={styles.champ}><label>{t("telephone")}</label><input value={valeurs.telephone} onChange={(e) => majChamp("telephone", e.target.value)} /></div>
              <div className={styles.champ}>
                <label>{t("mode_paiement_label")}</label>
                <select value={valeurs.mode_paiement} onChange={(e) => majChamp("mode_paiement", e.target.value)}>
                  <option value="">—</option>
                  <option value="especes">{t("mode_especes")}</option>
                  <option value="orange_money">{t("mode_orange_money")}</option>
                  <option value="virement">{t("mode_virement")}</option>
                </select>
              </div>
              <div className={styles.champ}><label>{t("notes")}</label><textarea rows={2} value={valeurs.notes} onChange={(e) => majChamp("notes", e.target.value)} /></div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="button" className={styles.boutonPrincipal} onClick={handleSubmit} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <ModalConfirmation titre={t("confirmer_suppression_titre")} message={t("confirmer_suppression_message")} onConfirmer={confirmerSuppression} onAnnuler={() => setASupprimer(null)} />
      )}
    </div>
  );
}

export default PageCreance;