import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2 } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import { pelerinService } from "../../services/pelerinService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

const CATEGORIES = [
  ["charges_communes", "Charges communes"], ["iban", "Charges particulières IBAN"],
  ["consulat", "Charges particulières CONSULAT"], ["transport_mounazim", "Transport Mounazim"],
  ["prime_mounazim", "Prime Mounazim"], ["scan_passeport", "Scan passeport pour Visa"],
  ["frais_docteur", "Frais docteur"], ["medicaments", "Frais médicaments pèlerins"],
  ["unapo", "Cotisation UNAPO"], ["dnp", "Frais DNP"], ["mouton", "Frais mouton"],
  ["difference_taux", "Différence de taux d'échange"], ["envoi_consulat", "Frais d'envoi au consulat"],
  ["prime_guide", "Prime Guide"], ["depenses_personnelles", "Dépenses personnelles"], ["autre", "Autres dépenses"],
];

const VALEURS_INITIALES = { categorie: "", libelle_complementaire: "", montant: "", devise: "GNF", date: new Date().toISOString().slice(0, 10) };

function PageBeneficePelerin({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pelerins, setPelerins] = useState([]);
  const [pelerinSelectionne, setPelerinSelectionne] = useState("");
  const [depenses, setDepenses] = useState([]);
  const [recap, setRecap] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  useEffect(() => {
    pelerinService.lister({ type_voyage: "pelerinage" }).then(({ data }) => {
      setPelerins(data);
      setChargement(false);
    });
  }, []);

  const chargerPelerin = async (id) => {
    if (!id) { setDepenses([]); setRecap(null); return; }
    const [depRes, recapRes] = await Promise.all([
      decaissementService.listerDepensesPelerin(id),
      decaissementService.obtenirRecapPelerin(id),
    ]);
    setDepenses(depRes.data);
    setRecap(recapRes.data);
  };

  const changerPelerin = async (id) => {
    setPelerinSelectionne(id);
    await chargerPelerin(id);
  };

  const ouvrirNouveau = () => {
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async () => {
    if (!valeurs.categorie || !valeurs.montant || !pelerinSelectionne) {
      setErreur(t("champs_obligatoires_manquants"));
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      await decaissementService.creerDepensePelerin({ ...valeurs, pelerin: pelerinSelectionne });
      setModalOuverte(false);
      await chargerPelerin(pelerinSelectionne);
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerDepensePelerin(aSupprimer.id);
    setASupprimer(null);
    await chargerPelerin(pelerinSelectionne);
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("benefice_pelerin")}</h1>
        <select value={pelerinSelectionne} onChange={(e) => changerPelerin(e.target.value)} className={styles.selectAnnee} style={{ minWidth: 240 }}>
          <option value="">{t("selectionner_pelerin")}</option>
          {pelerins.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.numero_id})</option>)}
        </select>
      </div>

      {pelerinSelectionne && (
        <>
          <div className={styles.entete} style={{ marginTop: 0 }}>
            <div />
            <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
              <Plus size={16} /> {t("ajouter_depense")}
            </button>
          </div>

          {recap && (
            <div className={styles.conteneurRecap}>
              <table className={styles.tableauRecap}>
                <thead>
                  <tr><th>{t("designation")}</th><th>GNF</th><th>USD</th><th>SAR</th></tr>
                </thead>
                <tbody>
                  {recap.lignes.map((l, i) => (
                    <tr key={i} className={l.gras ? styles.ligneTotalRecap : ""}>
                      <td className={styles.cellCategorie}>{l.designation}</td>
                      <td className={styles.cellMontant}>{l.valeurs.gnf.toLocaleString("fr-FR")}</td>
                      <td className={styles.cellMontant}>{l.valeurs.usd.toLocaleString("fr-FR")}</td>
                      <td className={styles.cellMontant}>{l.valeurs.sar.toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className={styles.sousTitreListe} style={{ marginTop: 20 }}>{t("detail_depenses")}</h2>
          <div className={styles.conteneurTableau}>
            <table className={styles.tableau}>
              <thead>
                <tr><th>{t("date")}</th><th>{t("categorie")}</th><th>{t("montant")}</th><th></th></tr>
              </thead>
              <tbody>
                {depenses.length === 0 && <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
                {depenses.map((d) => (
                  <tr key={d.id}>
                    <td>{d.date}</td>
                    <td>{d.categorie_display}{d.libelle_complementaire && ` — ${d.libelle_complementaire}`}</td>
                    <td className={styles.cellMontantListe}>{parseFloat(d.montant).toLocaleString("fr-FR")} {d.devise}</td>
                    <td className={styles.cellActions}>
                      <button onClick={() => setASupprimer(d)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("ajouter_depense")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("categorie")}</label>
                <select value={valeurs.categorie} onChange={(e) => majChamp("categorie", e.target.value)}>
                  <option value="">—</option>
                  {CATEGORIES.map(([cle, label]) => <option key={cle} value={cle}>{label}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("precision_libelle")}</label>
                <input value={valeurs.libelle_complementaire} onChange={(e) => majChamp("libelle_complementaire", e.target.value)} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("montant")}</label>
                  <input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("devise")}</label>
                  <select value={valeurs.devise} onChange={(e) => majChamp("devise", e.target.value)}>
                    <option value="GNF">GNF</option><option value="USD">USD</option><option value="SAR">SAR</option>
                  </select>
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" min="2020-01-01" max="2035-12-31" value={valeurs.date} onChange={(e) => majChamp("date", e.target.value)} />
              </div>
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
        <ModalConfirmation
          titre={t("confirmer_suppression_titre")}
          message={t("confirmer_suppression_message")}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}

export default PageBeneficePelerin;