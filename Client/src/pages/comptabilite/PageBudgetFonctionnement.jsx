import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import BoutonExporter from "../../components/export/BoutonExporter";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";
import stylesBudget from "../../theme/pages/comptabilite/PageBudgetFonctionnement.module.css";

const VALEURS_INITIALES = { designation: "", type: "entree", montant: "", date: new Date().toISOString().slice(0, 10), notes: "" };

const NOMS_MOIS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const COLONNES_EXPORT = [
  { cle: "numero", entete: "N°", largeur: 8 },
  { cle: "designation", entete: "Désignation", largeur: 32 },
  { cle: "date", entete: "Date", largeur: 14, format: "date" },
  { cle: "entree", entete: "Entrée (GNF)", largeur: 16, format: "nombre" },
  { cle: "sortie", entete: "Sortie (GNF)", largeur: 16, format: "nombre" },
  { cle: "solde", entete: "Solde (GNF)", largeur: 16, format: "nombre" },
];

function PageBudgetFonctionnement({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lignes, setLignes] = useState([]);
  const [recap, setRecap] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [ligneAModifier, setLigneAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  const charger = async () => {
    setChargement(true);
    const [lignesRes, recapRes] = await Promise.all([
      decaissementService.listerBudgetFonctionnement(),
      decaissementService.obtenirRecapBudget(),
    ]);
    setLignes(lignesRes.data);
    setRecap(recapRes.data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const ouvrirNouveau = () => {
    setLigneAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (l) => {
    setLigneAModifier(l);
    setValeurs({
      designation: l.designation,
      type: l.montant_entree ? "entree" : "sortie",
      montant: l.montant_entree || l.montant_sortie || "",
      date: l.date,
      notes: l.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async () => {
    setErreur("");
    if (!valeurs.designation || !valeurs.montant || !valeurs.date) {
      setErreur(t("champs_obligatoires_manquants"));
      return;
    }
    setEnvoi(true);
    try {
      const donnees = {
        designation: valeurs.designation,
        date: valeurs.date,
        notes: valeurs.notes,
        montant_entree: valeurs.type === "entree" ? valeurs.montant : null,
        montant_sortie: valeurs.type === "sortie" ? valeurs.montant : null,
      };
      if (ligneAModifier) {
        await decaissementService.modifierLigneBudget(ligneAModifier.id, donnees);
      } else {
        await decaissementService.creerLigneBudget(donnees);
      }
      setModalOuverte(false);
      await charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerLigneBudget(aSupprimer.id);
    setASupprimer(null);
    await charger();
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  // Solde courant calculé ligne par ligne (ordre chronologique), puis
  // regroupement par mois pour l'affichage façon relevé bancaire.
  let solde = 0;
  const lignesAvecSolde = lignes.map((l, index) => {
    solde += parseFloat(l.montant_entree || 0) - parseFloat(l.montant_sortie || 0);
    return { ...l, numero: index + 1, soldeApres: solde };
  });

  const groupes = {};
  lignesAvecSolde.forEach((l) => {
    const d = new Date(l.date);
    const cle = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groupes[cle]) groupes[cle] = { annee: d.getFullYear(), mois: d.getMonth(), lignes: [] };
    groupes[cle].lignes.push(l);
  });
  const groupesOrdonnes = Object.values(groupes).sort((a, b) => (a.annee - b.annee) || (a.mois - b.mois));

  // Courbe d'évolution du solde en SVG pur (aucune librairie).
  const points = lignesAvecSolde.map((l) => l.soldeApres);
  const max = Math.max(...points, 0);
  const min = Math.min(...points, 0);
  const echelle = max - min || 1;
  const coordonnees = points.map((v, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * 280 : 140;
    const y = 50 - ((v - min) / echelle) * 46;
    return `${x},${y}`;
  }).join(" ");
  const yZero = 50 - ((0 - min) / echelle) * 46;

  const lignesExport = lignesAvecSolde.map((l) => ({
    numero: l.numero,
    designation: l.designation,
    date: l.date,
    entree: l.montant_entree ? parseFloat(l.montant_entree) : null,
    sortie: l.montant_sortie ? parseFloat(l.montant_sortie) : null,
    solde: l.soldeApres,
  }));

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("budget_fonctionnement")}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BoutonExporter
            titre={t("budget_fonctionnement")}
            colonnes={COLONNES_EXPORT}
            lignes={lignesExport}
            totaux={recap ? { entree: recap.total_entree, sortie: recap.total_sortie, solde: recap.total_restant } : null}
          />
          <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
            <Plus size={16} /> {t("nouvelle_ligne")}
          </button>
        </div>
      </div>

      {recap && (
        <div className={styles.totalGeneralBloc}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <span>{t("total_entree")} / {t("total_depense")} / {t("total_restant")}</span>
            <div className={styles.totalGeneralValeurs} style={{ marginTop: 6 }}>
              <span style={{ color: "#9CD9B0" }}>+{recap.total_entree.toLocaleString("fr-FR")}</span>
              <span style={{ color: "#F3B3A6" }}>-{recap.total_sortie.toLocaleString("fr-FR")}</span>
              <strong>{recap.total_restant.toLocaleString("fr-FR")} GNF</strong>
            </div>
          </div>
          {points.length > 1 && (
            <svg viewBox="0 0 280 50" className={stylesBudget.sparkline}>
              <polyline points={coordonnees} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="0" y1={yZero} x2="280" y2={yZero} stroke="rgba(255,255,255,0.15)" strokeDasharray="3,3" />
            </svg>
          )}
        </div>
      )}

      {groupesOrdonnes.length === 0 && <p className={styles.etatVide}>{t("aucun_resultat")}</p>}

      {groupesOrdonnes.map((groupe) => {
        const totalMoisEntree = groupe.lignes.reduce((s, l) => s + parseFloat(l.montant_entree || 0), 0);
        const totalMoisSortie = groupe.lignes.reduce((s, l) => s + parseFloat(l.montant_sortie || 0), 0);
        return (
          <div key={`${groupe.annee}-${groupe.mois}`} className={stylesBudget.blocMois}>
            <div className={stylesBudget.enteteMois}>
              <span className={stylesBudget.nomMois}>{NOMS_MOIS_FR[groupe.mois]} {groupe.annee}</span>
              <span className={stylesBudget.sousTotalMois}>
                <span style={{ color: "#165C39" }}>+{totalMoisEntree.toLocaleString("fr-FR")}</span>
                {" · "}
                <span style={{ color: "#8A2F22" }}>-{totalMoisSortie.toLocaleString("fr-FR")}</span>
              </span>
            </div>
            <div className={styles.conteneurTableau}>
              <table className={`${styles.tableau} ${stylesBudget.tableauBudget}`}>
                <thead>
                  <tr>
                    <th>{t("numero")}</th>
                    <th>{t("designation")}</th>
                    <th>{t("date")}</th>
                    <th>{t("entree")}</th>
                    <th>{t("sortie")}</th>
                    <th>{t("solde")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {groupe.lignes.map((l) => (
                    <tr key={l.id} className={l.montant_entree ? stylesBudget.ligneEntree : stylesBudget.ligneSortie}>
                      <td className={stylesBudget.cellNumero}>{l.numero}</td>
                      <td>{l.designation}</td>
                      <td>{l.date}</td>
                      <td className={stylesBudget.montantEntree}>{l.montant_entree ? parseFloat(l.montant_entree).toLocaleString("fr-FR") : "—"}</td>
                      <td className={stylesBudget.montantSortie}>{l.montant_sortie ? parseFloat(l.montant_sortie).toLocaleString("fr-FR") : "—"}</td>
                      <td className={stylesBudget.montantSolde}>{l.soldeApres.toLocaleString("fr-FR")}</td>
                      <td className={`${styles.cellActions} ${stylesBudget.celluleActions}`}>
                        <button onClick={() => ouvrirModification(l)} title={t("modifier")}><Pencil size={13} /></button>
                        <button onClick={() => setASupprimer(l)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{ligneAModifier ? t("modifier_ligne") : t("nouvelle_ligne")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("designation")}</label>
                <input value={valeurs.designation} onChange={(e) => majChamp("designation", e.target.value)} placeholder={t("ex_designation_budget")} />
              </div>
              <div className={styles.champ}>
                <label>{t("type_mouvement")}</label>
                <div className={stylesBudget.choixMouvement}>
                  <button
                    type="button"
                    className={`${stylesBudget.boutonMouvement} ${valeurs.type === "entree" ? stylesBudget.entreeActive : ""}`}
                    onClick={() => majChamp("type", "entree")}
                  >
                    ↓ {t("entree")}
                  </button>
                  <button
                    type="button"
                    className={`${stylesBudget.boutonMouvement} ${valeurs.type === "sortie" ? stylesBudget.sortieActive : ""}`}
                    onClick={() => majChamp("type", "sortie")}
                  >
                    ↑ {t("sortie")}
                  </button>
                </div>
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("montant")} (GNF)</label>
                  <input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("date")}</label>
                  <input type="date" value={valeurs.date} onChange={(e) => majChamp("date", e.target.value)} />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("notes")}</label>
                <textarea rows={2} value={valeurs.notes} onChange={(e) => majChamp("notes", e.target.value)} />
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

export default PageBudgetFonctionnement;