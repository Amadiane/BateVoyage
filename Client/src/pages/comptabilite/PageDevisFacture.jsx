import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, AlertCircle } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import { pelerinService } from "../../services/pelerinService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

const VALEURS_INITIALES = { type_document: "devis", pelerin: "", client_nom: "", montant: "", devise: "GNF", date_emission: new Date().toISOString().slice(0, 10), notes: "" };

function PageDevisFacture({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [pelerins, setPelerins] = useState([]);
  const [filtreType, setFiltreType] = useState("");
  const [vueImpayes, setVueImpayes] = useState(false);
  const [totalImpaye, setTotalImpaye] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [documentAModifier, setDocumentAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  const charger = () => {
    setChargement(true);
    if (vueImpayes) {
      decaissementService.obtenirImpayes().then(({ data }) => {
        setDocuments(data.documents);
        setTotalImpaye(data.total_impaye);
        setChargement(false);
      });
    } else {
      const params = {};
      if (filtreType) params.type_document = filtreType;
      decaissementService.listerDevisFactures(params).then(({ data }) => {
        setDocuments(data);
        setChargement(false);
      });
    }
  };

  useEffect(() => { charger(); }, [filtreType, vueImpayes]);
  useEffect(() => { pelerinService.lister({ type_voyage: "pelerinage" }).then(({ data }) => setPelerins(data)); }, []);

  const ouvrirNouveau = () => {
    setDocumentAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (d) => {
    setDocumentAModifier(d);
    setValeurs({
      type_document: d.type_document, pelerin: d.pelerin || "", client_nom: d.client_nom || "",
      montant: d.montant, devise: d.devise, date_emission: d.date_emission, notes: d.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async () => {
    setErreur("");
    if (!valeurs.montant || !valeurs.date_emission) {
      setErreur(t("champs_obligatoires_manquants"));
      return;
    }
    setEnvoi(true);
    try {
      const donnees = { ...valeurs };
      if (!donnees.pelerin) delete donnees.pelerin;
      if (documentAModifier) {
        await decaissementService.modifierDevisFacture(documentAModifier.id, donnees);
      } else {
        await decaissementService.creerDevisFacture(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const marquerPaye = async (d) => {
    await decaissementService.modifierDevisFacture(d.id, { paye: true });
    charger();
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerDevisFacture(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("devis_facture")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_document")}
        </button>
      </div>

      <div className={styles.groupeBoutons} style={{ marginBottom: 14 }}>
        <select value={filtreType} onChange={(e) => { setFiltreType(e.target.value); setVueImpayes(false); }} className={styles.selectAnnee}>
          <option value="">{t("tous")}</option>
          <option value="devis">{t("type_devis")}</option>
          <option value="facture">{t("type_facture")}</option>
          <option value="avoir">{t("type_avoir")}</option>
        </select>
        <button
          className={vueImpayes ? styles.boutonPrincipal : styles.boutonSecondaire}
          onClick={() => { setVueImpayes(!vueImpayes); setFiltreType(""); }}
        >
          <AlertCircle size={14} style={{ marginRight: 6 }} /> {t("etats_impayes")}
        </button>
      </div>

      {vueImpayes && (
        <p className={styles.tauxActuel}>{t("total_impaye")} : <strong>{totalImpaye.toLocaleString("fr-FR")} GNF</strong></p>
      )}

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("numero")}</th><th>{t("type")}</th><th>{t("client")}</th>
              <th>{t("date")}</th><th>{t("montant")}</th><th>{t("statut")}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={7} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && documents.length === 0 && <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && documents.map((d) => (
              <tr key={d.id}>
                <td className={styles.cellCategorie}>{d.numero}</td>
                <td>{d.type_document_display}</td>
                <td>{d.pelerin_nom || d.client_nom || "—"}</td>
                <td>{d.date_emission}</td>
                <td className={styles.cellMontantListe}>{parseFloat(d.montant).toLocaleString("fr-FR")} {d.devise}</td>
                <td>
                  <span className={d.paye ? styles.badgeVert : styles.badgeRouge}>
                    {d.paye ? t("paye") : t("non_paye")}
                  </span>
                </td>
                <td className={styles.cellActions}>
                  {!d.paye && <button onClick={() => marquerPaye(d)} title={t("marquer_paye")}>✓</button>}
                  <button onClick={() => ouvrirModification(d)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={() => setASupprimer(d)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
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
              <h2>{documentAModifier ? t("modifier_document") : t("nouveau_document")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("type")}</label>
                <select value={valeurs.type_document} onChange={(e) => majChamp("type_document", e.target.value)}>
                  <option value="devis">{t("type_devis")}</option>
                  <option value="facture">{t("type_facture")}</option>
                  <option value="avoir">{t("type_avoir")}</option>
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("pelerin_concerne")} ({t("optionnel")})</label>
                <select value={valeurs.pelerin} onChange={(e) => majChamp("pelerin", e.target.value)}>
                  <option value="">—</option>
                  {pelerins.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("client_nom_libre")} ({t("optionnel")})</label>
                <input value={valeurs.client_nom} onChange={(e) => majChamp("client_nom", e.target.value)} />
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
              <div className={styles.champ}><label>{t("date")}</label><input type="date" min="2020-01-01" max="2035-12-31" value={valeurs.date_emission} onChange={(e) => majChamp("date_emission", e.target.value)} /></div>
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

export default PageDevisFacture;