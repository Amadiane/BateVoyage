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
const LABEL_CATEGORIE = Object.fromEntries(CATEGORIES);

const CLASSE_MONTANT = { GNF: "montantGNF", USD: "montantUSD", SAR: "montantSAR" };

const VALEURS_INITIALES = () => ({
  categorie: "",
  libelle_complementaire: "",
  montant: "",
  devise: "GNF",
  date: new Date().toISOString().slice(0, 10),
});

const fmt = (n) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function PageBeneficePelerin({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const estOumra = activite === "oumra";

  const [depenses, setDepenses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [depenseAModifier, setDepenseAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES());
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  // Taux de change saisis par le client (GNF pour 1 USD / 1 SAR)
  const [tauxUsd, setTauxUsd] = useState("");
  const [tauxSar, setTauxSar] = useState("");
  const [enregistrementTaux, setEnregistrementTaux] = useState(false);
  const [messageTaux, setMessageTaux] = useState("");

  const charger = () => {
    setChargement(true);
    decaissementService.listerDepensesPelerin({ activite }).then(({ data }) => {
      setDepenses(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [activite]);

  useEffect(() => {
    if (!estOumra) return;
    decaissementService.obtenirTauxChange().then(({ data }) => {
      setTauxUsd(data?.taux_usd ?? "");
      setTauxSar(data?.taux_sar ?? "");
    }).catch(() => {});
  }, [estOumra]);

  const enregistrerTaux = async () => {
    setMessageTaux("");
    setEnregistrementTaux(true);
    try {
      await decaissementService.modifierTauxChange({
        taux_usd: parseFloat(tauxUsd) || 0,
        taux_sar: parseFloat(tauxSar) || 0,
      });
      setMessageTaux(t("taux_enregistre", "Taux enregistré"));
    } catch {
      setMessageTaux(t("erreur_enregistrement"));
    } finally {
      setEnregistrementTaux(false);
    }
  };

  const ouvrirNouveau = () => {
    setDepenseAModifier(null);
    setValeurs(VALEURS_INITIALES());
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (d) => {
    setDepenseAModifier(d);
    setValeurs({
      categorie: d.categorie || "",
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
    // Oumra : la catégorie est optionnelle, mais il faut au moins une catégorie ou une désignation.
    if (estOumra && !valeurs.categorie && !valeurs.libelle_complementaire.trim()) {
      setErreur(t("categorie_ou_designation", "Renseignez une catégorie ou une désignation."));
      return;
    }
    setEnvoi(true);
    try {
      const donnees = { ...valeurs, activite };
      if (depenseAModifier) {
        await decaissementService.modifierDepensePelerin(depenseAModifier.id, donnees);
      } else {
        await decaissementService.creerDepensePelerin(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      const data = err?.response?.data;
      setErreur(data && typeof data === "object" ? JSON.stringify(data) : t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimerDepensePelerin(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  // ---- Conversion automatique selon les taux saisis ----
  const taux = { GNF: 1, USD: parseFloat(tauxUsd) || 0, SAR: parseFloat(tauxSar) || 0 };

  // Convertit un montant vers GNF (null si le taux nécessaire manque)
  const versGNF = (montant, devise) => {
    const m = parseFloat(montant) || 0;
    if (devise === "GNF") return m;
    return taux[devise] > 0 ? m * taux[devise] : null;
  };

  const depuisGNF = (gnf, devise) => (devise === "GNF" ? gnf : taux[devise] > 0 ? gnf / taux[devise] : null);

  // Total en GNF -> 3 colonnes
  const triple = (gnf) => ({
    GNF: gnf === null ? null : gnf,
    USD: gnf === null ? null : depuisGNF(gnf, "USD"),
    SAR: gnf === null ? null : depuisGNF(gnf, "SAR"),
  });

  // ---- Récapitulatif ----
  // Hajj : 16 catégories fixes, totaux par devise saisie (inchangé).
  const recapHajj = useMemo(() => {
    return CATEGORIES.map(([cle, label]) => {
      const lignes = depenses.filter((d) => d.categorie === cle);
      const totaux = DEVISES.reduce((acc, dev) => {
        acc[dev] = lignes.filter((d) => d.devise === dev).reduce((s, d) => s + parseFloat(d.montant), 0);
        return acc;
      }, {});
      return { cle, label, totaux };
    });
  }, [depenses]);

  const totalHajj = DEVISES.reduce((acc, dev) => {
    acc[dev] = depenses.filter((d) => d.devise === dev).reduce((s, d) => s + parseFloat(d.montant), 0);
    return acc;
  }, {});

  // Oumra : uniquement les lignes réellement saisies ; chaque ligne est convertie en GNF,
  // puis exprimée dans les trois devises.
  const recapOumra = useMemo(() => {
    const groupes = new Map();
    depenses.forEach((d) => {
      const lib = (d.libelle_complementaire || "").trim();
      let cle, label;
      if (d.categorie) { cle = `c:${d.categorie}`; label = LABEL_CATEGORIE[d.categorie] || d.categorie_display || d.categorie; }
      else if (lib) { cle = `l:${lib.toLowerCase()}`; label = lib; }
      else { cle = "aucune"; label = t("sans_categorie", "Sans catégorie"); }
      if (!groupes.has(cle)) groupes.set(cle, { cle, label, gnf: 0, manquant: false });
      const g = groupes.get(cle);
      const v = versGNF(d.montant, d.devise);
      if (v === null) g.manquant = true; else g.gnf += v;
    });
    return Array.from(groupes.values()).map((g) => ({ ...g, totaux: triple(g.manquant ? null : g.gnf) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depenses, tauxUsd, tauxSar]);

  const totalOumra = useMemo(() => {
    let gnf = 0; let manquant = false;
    depenses.forEach((d) => {
      const v = versGNF(d.montant, d.devise);
      if (v === null) manquant = true; else gnf += v;
    });
    return triple(manquant ? null : gnf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depenses, tauxUsd, tauxSar]);

  const rows = estOumra
    ? recapOumra.map((g) => ({ cle: g.cle, label: g.label, totaux: g.totaux }))
    : recapHajj;
  const total = estOumra ? totalOumra : totalHajj;
  const cellule = (v) => (v === null || v === undefined ? "—" : fmt(v));
  const tauxManquant = estOumra && depenses.some((d) => d.devise !== "GNF" && !(taux[d.devise] > 0));

  const libelleDepense = (d) => {
    const base = d.categorie ? (LABEL_CATEGORIE[d.categorie] || d.categorie_display) : "";
    const lib = d.libelle_complementaire || "";
    return [base, lib].filter(Boolean).join(" — ") || "—";
  };

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
        categorie: libelleDepense(d),
        montant: parseFloat(d.montant) || 0,
        devise: d.devise,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {estOumra && (
        <div className={styles.conteneurRecap} style={{ padding: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className={styles.champ} style={{ minWidth: 160 }}>
              <label>{t("taux_usd", "1 USD = ... GNF")}</label>
              <input type="number" step="0.01" min="0" value={tauxUsd} onChange={(e) => setTauxUsd(e.target.value)} />
            </div>
            <div className={styles.champ} style={{ minWidth: 160 }}>
              <label>{t("taux_sar", "1 SAR = ... GNF")}</label>
              <input type="number" step="0.01" min="0" value={tauxSar} onChange={(e) => setTauxSar(e.target.value)} />
            </div>
            <button type="button" className={styles.boutonSecondaire} onClick={enregistrerTaux} disabled={enregistrementTaux}>
              {t("enregistrer_taux", "Enregistrer les taux")}
            </button>
            {messageTaux && <span>{messageTaux}</span>}
          </div>
          {tauxManquant && (
            <p className={styles.erreur} style={{ marginTop: 8 }}>
              {t("taux_manquant", "Saisissez les taux de change pour convertir les montants en USD/SAR.")}
            </p>
          )}
        </div>
      )}

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
              {rows.length === 0 && (
                <tr><td colSpan={4} className={styles.etatVide}>{t("aucune_depense", "Aucune dépense enregistrée")}</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.cle}>
                  <td className={styles.cellCategorie}>
                    <span className={styles.puce} />
                    {c.label}
                  </td>
                  <td className={`${styles.cellMontant} ${styles.montantGNF}`}>{cellule(c.totaux.GNF)}</td>
                  <td className={`${styles.cellMontant} ${styles.montantUSD}`}>{cellule(c.totaux.USD)}</td>
                  <td className={`${styles.cellMontant} ${styles.montantSAR}`}>{cellule(c.totaux.SAR)}</td>
                </tr>
              ))}
              <tr className={styles.ligneTotalRecap}>
                <td>{t("total")}</td>
                <td>{cellule(total.GNF)}</td>
                <td>{cellule(total.USD)}</td>
                <td>{cellule(total.SAR)}</td>
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
                  <td>{libelleDepense(d)}</td>
                  <td className={`${styles.cellMontant} ${styles[CLASSE_MONTANT[d.devise]] || ""}`}>
                    {fmt(d.montant)} {d.devise}
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
                <label>{t("categorie")}{estOumra ? ` (${t("optionnel", "optionnel")})` : ""}</label>
                <select
                  value={valeurs.categorie}
                  onChange={(e) => majChamp("categorie", e.target.value)}
                  required={!estOumra}
                >
                  <option value="">{estOumra ? t("aucune_categorie", "— Aucune catégorie —") : "—"}</option>
                  {CATEGORIES.map(([cle, label]) => <option key={cle} value={cle}>{label}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{estOumra ? t("designation", "Désignation") : t("precision_libelle")}</label>
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