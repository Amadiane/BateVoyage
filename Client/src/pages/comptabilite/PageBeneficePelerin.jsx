import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, ChevronDown } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import BoutonExporter from "../../components/export/BoutonExporter";
import styles from "../../theme/pages/comptabilite/PageBeneficePelerin.module.css";

const DEVISES = ["GNF", "USD", "SAR"];

const CATEGORIES = [
  ["charges_communes", "Charges communes"], ["iban", "Charges particulières IBAN"],
  ["consulat", "Charges particulières CONSULAT"], ["transport_mounazim", "Transport Mounazim"],
  ["prime_mounazim", "Prime Mounazim"], ["scan_passeport", "Scan passeport pour Visa"],
  ["frais_docteur", "Frais docteur"], ["medicaments", "Frais médicaments pèlerins"],
  ["unapo", "Cotisation UNAPO"], ["dnp", "Frais DNP"], ["mouton", "Frais mouton"],
  ["difference_taux", "Différence de taux d'échange"], ["envoi_consulat", "Frais d'envoi au consulat"],
  ["prime_guide", "Prime Guide"], ["depenses_personnelles", "Dépenses personnelles"], ["autre", "Autres dépenses"],
];

const CLASSE_MONTANT = { GNF: "montantGNF", USD: "montantUSD", SAR: "montantSAR" };

const VALEURS_INITIALES = {
  categorie: "",
  libelle_complementaire: "",
  montant: "",
  devise: "GNF",
  date: new Date().toISOString().slice(0, 10),
};

function PageBeneficePelerin({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [depenses, setDepenses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [depenseAModifier, setDepenseAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  const charger = () => {
    setChargement(true);
    decaissementService.listerDepensesPelerin().then(({ data }) => {
      setDepenses(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const ouvrirNouveau = () => {
    setDepenseAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (d) => {
    setDepenseAModifier(d);
    setValeurs({
      categorie: d.categorie,
      libelle_complementaire: d.libelle_complementaire || "",
      montant: d.montant,
      devise: d.devise,
      date: d.date,
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      if (depenseAModifier) {
        await decaissementService.modifierDepensePelerin(depenseAModifier.id, valeurs);
      } else {
        await decaissementService.creerDepensePelerin(valeurs);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerDepensePelerin(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  // Récapitulatif par catégorie, dans l'ordre fixe de CATEGORIES, avec un total
  // GNF/USD/SAR par ligne — calculé côté client à partir des dépenses chargées.
  const recapParCategorie = useMemo(() => {
    return CATEGORIES.map(([cle, label]) => {
      const lignesCategorie = depenses.filter((d) => d.categorie === cle);
      const totaux = DEVISES.reduce((acc, dev) => {
        acc[dev] = lignesCategorie.filter((d) => d.devise === dev).reduce((s, d) => s + parseFloat(d.montant), 0);
        return acc;
      }, {});
      return { cle, label, totaux };
    });
  }, [depenses]);

  const totalGeneral = DEVISES.reduce((acc, dev) => {
    acc[dev] = depenses.filter((d) => d.devise === dev).reduce((s, d) => s + parseFloat(d.montant), 0);
    return acc;
  }, {});

  const colonnesExport = [
    { cle: "date", entete: t("date", "Date"), largeur: 14, format: "date" },
    { cle: "categorie", entete: t("categorie", "Catégorie"), largeur: 30 },
    { cle: "montant", entete: t("montant", "Montant"), largeur: 16, format: "nombre", decimales: 2 },
    { cle: "devise", entete: t("devise", "Devise"), largeur: 10, align: "center" },
  ];

  const lignesExport = useMemo(
    () =>
      depenses.map((d) => ({
        date: d.date,
        categorie: `${d.categorie_display}${d.libelle_complementaire ? ` — ${d.libelle_complementaire}` : ""}`,
        montant: parseFloat(d.montant) || 0,
        devise: d.devise,
      })),
    [depenses]
  );

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h2 className={styles.titre}>{t("benefice_pelerin")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <BoutonExporter
            titre={t("benefice_pelerin", "Bénéfice par Pèlerin")}
            colonnes={colonnesExport}
            lignes={lignesExport}
          />
          <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
            <Plus size={16} /> {t("ajouter_depense")}
          </button>
        </div>
      </div>

      {chargement && <p className={styles.chargement}>{t("chargement")}</p>}

      {!chargement && (
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
              {recapParCategorie.map((c) => (
                <tr key={c.cle}>
                  <td className={styles.cellCategorie}>
                    <span className={styles.puce} />
                    {c.label}
                  </td>
                  <td className={`${styles.cellMontant} ${styles.montantGNF}`}>{c.totaux.GNF.toLocaleString("fr-FR")}</td>
                  <td className={`${styles.cellMontant} ${styles.montantUSD}`}>{c.totaux.USD.toLocaleString("fr-FR")}</td>
                  <td className={`${styles.cellMontant} ${styles.montantSAR}`}>{c.totaux.SAR.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
              <tr className={styles.ligneTotalRecap}>
                <td>{t("total")}</td>
                <td>{totalGeneral.GNF.toLocaleString("fr-FR")}</td>
                <td>{totalGeneral.USD.toLocaleString("fr-FR")}</td>
                <td>{totalGeneral.SAR.toLocaleString("fr-FR")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <button className={styles.enteteHistoriqueRepliable} onClick={() => setHistoriqueOuvert((v) => !v)}>
        <span>{t("historique_depenses", "Historique des dépenses")} ({depenses.length})</span>
        <ChevronDown size={16} className={`${styles.chevron} ${historiqueOuvert ? styles.chevronOuvert : ""}`} />
      </button>

      {historiqueOuvert && (
        <div className={styles.conteneurTableau}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("categorie")}</th>
                <th style={{ textAlign: "right" }}>{t("montant")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {depenses.length === 0 && <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
              {depenses.map((d) => (
                <tr key={d.id}>
                  <td>{d.date}</td>
                  <td>
                    {d.categorie_display}
                    {d.libelle_complementaire && <span className={styles.libelleComplementaire}> — {d.libelle_complementaire}</span>}
                  </td>
                  <td className={`${styles.cellMontant} ${styles[CLASSE_MONTANT[d.devise]] || ""}`}>
                    {parseFloat(d.montant).toLocaleString("fr-FR")} {d.devise}
                  </td>
                  <td className={styles.cellActions}>
                    <button onClick={() => ouvrirModification(d)} title={t("modifier")}><Pencil size={13} /></button>
                    <button onClick={() => setASupprimer(d)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{depenseAModifier ? t("modifier_depense", "Modifier la dépense") : t("ajouter_depense")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("categorie")}</label>
                <select value={valeurs.categorie} onChange={(e) => majChamp("categorie", e.target.value)} required>
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
                  <input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("devise")}</label>
                  <select value={valeurs.devise} onChange={(e) => majChamp("devise", e.target.value)}>
                    {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" min="2020-01-01" max="2035-12-31" value={valeurs.date} onChange={(e) => majChamp("date", e.target.value)} required />
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </form>
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