import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decaissementService } from "../../services/decaissementService";
import BoutonExporter from "../../components/export/BoutonExporter";
import { TableauAgences, TableauRepartitionAssocies } from "../../components/TableauxHajj/TableauxHajj";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";
import stylesInd from "../../theme/pages/comptabilite/PageBeneficeIndividuel.module.css";

function CelluleMontant({ valeur }) {
  if (!valeur) return <span className={stylesInd.vide}>—</span>;
  return (
    <>
      <span className={stylesInd.montantGnf}>{valeur.gnf.toLocaleString("fr-FR")}</span>
      <span className={stylesInd.montantDevises}>
        {valeur.usd.toLocaleString("fr-FR")} USD · {valeur.sar.toLocaleString("fr-FR")} SAR
      </span>
    </>
  );
}

const COLONNES_AGENCES = [
  { cle: "agence", entete: "Agence", largeur: 30 },
  { cle: "pelerins", entete: "Pèlerins", largeur: 12, format: "nombre" },
  { cle: "pourcentage", entete: "% des pèlerins", largeur: 14, format: "nombre" },
  { cle: "gnf", entete: "Bénéfice (GNF)", largeur: 18, format: "nombre" },
  { cle: "usd", entete: "Bénéfice (USD)", largeur: 14, format: "nombre" },
  { cle: "sar", entete: "Bénéfice (SAR)", largeur: 14, format: "nombre" },
];

// En-tête d'un associé dans l'export : nom + agence (Hajj)
const libelleAssocie = (a) => (a.groupe ? `${a.nom} — ${a.groupe}` : a.nom);

const COLONNES_DETAIL_AGENCE = [
  { cle: "designation", entete: "Désignation", largeur: 52 },
  { cle: "gnf", entete: "GNF", largeur: 16, format: "nombre" },
  { cle: "usd", entete: "USD", largeur: 14, format: "nombre" },
  { cle: "sar", entete: "SAR (riyal saoudien)", largeur: 18, format: "nombre" },
];

const GROUPE_PRINCIPAL = "BATE VOYAGE GUINÉE";

const COLONNES_ASSOCIE = [
  { cle: "designation", entete: "Désignation", largeur: 32 },
  { cle: "gnf", entete: "GNF", largeur: 16, format: "nombre" },
  { cle: "usd", entete: "USD", largeur: 12, format: "nombre" },
  { cle: "sar", entete: "SAR", largeur: 12, format: "nombre" },
];

function PageBeneficeIndividuel({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saisons, setSaisons] = useState([]);
  const [saisonSelectionnee, setSaisonSelectionnee] = useState(null);
  const [donnees, setDonnees] = useState(null);
  const [synthese, setSynthese] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [associeSelectionne, setAssocieSelectionne] = useState(null);
  const [vue, setVue] = useState("associe");

  // Oumra : uniquement le tableau récapitulatif (pourcentages selon les inscriptions).
  // Hajj : trois boutons — "Par associé", "Tableau 1 · Agences", "Tableau 2 · Associés".
  const estOumra = activite === "oumra";
  const vueEffective = estOumra ? "recap" : vue;

  const charger = async (idSaison) => {
    if (!idSaison) {
      setDonnees(null);
      setSynthese(null);
      return;
    }
    const [indRes, synthRes] = await Promise.all([
      decaissementService.obtenirBeneficeIndividuel(activite, idSaison),
      decaissementService.obtenirSyntheseBenefices(activite, idSaison),
    ]);
    setDonnees(indRes.data);
    setSynthese(synthRes.data);
    // Sélectionne toujours le premier associé après un rechargement,
    // pour éviter un ID sélectionné qui ne correspondrait plus à rien.
    if (indRes.data.associes.length > 0) {
      setAssocieSelectionne(Number(indRes.data.associes[0].associe_id));
    }
  };

  useEffect(() => {
    const init = async () => {
      setChargement(true);
      const { data } = await decaissementService.listerSaisons(activite);
      setSaisons(data);
      const parDefaut = (data.find((s) => s.est_active) || data[0])?.id || null;
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

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  // Comparaison forcée en nombre des deux côtés : évite tout échec silencieux
  // de .find() dû à une différence string/number.
  const associeAffiche = donnees?.associes.find(
    (a) => Number(a.associe_id) === Number(associeSelectionne)
  );

  const nomSaisonActuelle = saisons.find((s) => s.id === saisonSelectionnee)?.nom || "";

  // Export de la vue "Par associé" : désignation/GNF/USD/SAR pour l'associé sélectionné.
  const lignesExportAssocie = associeAffiche
    ? associeAffiche.lignes.map((l) => ({
        designation: l.designation,
        gnf: l.valeurs.gnf,
        usd: l.valeurs.usd,
        sar: l.valeurs.sar,
      }))
    : [];

  // Export de la vue "Récapitulatif" : une colonne GNF/USD/SAR par associé + total,
  // reconstruite dynamiquement selon le nombre d'associés de la saison.
  const colonnesExportRecap = synthese
    ? [
        { cle: "designation", entete: "Désignation", largeur: 28 },
        ...synthese.associes.flatMap((a, i) => [
          { cle: `assoc_${i}_gnf`, entete: `${libelleAssocie(a)} (GNF)`, largeur: 16, format: "nombre" },
          { cle: `assoc_${i}_usd`, entete: `${libelleAssocie(a)} (USD)`, largeur: 12, format: "nombre" },
          { cle: `assoc_${i}_sar`, entete: `${libelleAssocie(a)} (SAR)`, largeur: 12, format: "nombre" },
        ]),
        { cle: "total_gnf", entete: "Total (GNF)", largeur: 16, format: "nombre" },
        { cle: "total_usd", entete: "Total (USD)", largeur: 12, format: "nombre" },
        { cle: "total_sar", entete: "Total (SAR)", largeur: 12, format: "nombre" },
      ]
    : [];

  const lignesExportRecap = synthese
    ? synthese.lignes.map((l) => {
        const ligne = { designation: t(`synthese_${l.cle}`) };
        l.valeurs.forEach((v, i) => {
          ligne[`assoc_${i}_gnf`] = v ? v.gnf : null;
          ligne[`assoc_${i}_usd`] = v ? v.usd : null;
          ligne[`assoc_${i}_sar`] = v ? v.sar : null;
        });
        ligne.total_gnf = l.total ? l.total.gnf : null;
        ligne.total_usd = l.total ? l.total.usd : null;
        ligne.total_sar = l.total ? l.total.sar : null;
        return ligne;
      })
    : [];

  // Export du Tableau 1 (Hajj) : une ligne par agence + total
  const lignesExportAgences = (synthese?.groupes || []).map((g) => ({
    agence: g.nom,
    pelerins: g.nb_pelerins,
    pourcentage: g.pourcentage,
    gnf: g.benefice.gnf,
    usd: g.benefice.usd,
    sar: g.benefice.sar,
  }));
  const totauxExportAgences = synthese?.total_groupes
    ? {
        pelerins: synthese.total_groupes.nb_pelerins,
        gnf: synthese.total_groupes.benefice.gnf,
        usd: synthese.total_groupes.benefice.usd,
        sar: synthese.total_groupes.benefice.sar,
      }
    : null;

  // Export d'UNE agence : son bénéfice et uniquement ses propres associés.
  // Les associés des autres agences n'y figurent jamais.
  const exportDeLAgence = (g) => {
    const valeurs = (cle) => synthese.lignes.find((l) => l.cle === cle)?.valeurs || [];
    const parts = valeurs("part");
    const dettes = valeurs("dettes");
    const nets = valeurs("net");
    const lignes = [
      {
        designation: `Bénéfice de l'agence (${g.nb_pelerins} pèlerins · ${g.pourcentage} %)`,
        gnf: g.benefice.gnf, usd: g.benefice.usd, sar: g.benefice.sar,
      },
    ];
    const netsAgence = [];
    synthese.associes.forEach((a, i) => {
      if (a.groupe !== g.nom) return;
      const ajouter = (libelle, v) => {
        if (v) lignes.push({ designation: `${a.nom} — ${libelle}`, gnf: v.gnf, usd: v.usd, sar: v.sar });
      };
      ajouter(`part (${a.pourcentage} %)`, parts[i]);
      if (!a.est_caisse) ajouter("dettes à déduire", dettes[i]);
      ajouter("net à recevoir", nets[i]);
      if (nets[i]) netsAgence.push(nets[i]);
    });
    const totaux = netsAgence.reduce(
      (acc, v) => ({ gnf: acc.gnf + v.gnf, usd: acc.usd + v.usd, sar: acc.sar + v.sar }),
      { gnf: 0, usd: 0, sar: 0 }
    );
    return {
      titre: `${t("benefice_individuel")} — ${g.nom}`,
      sousTitre: `${nomSaisonActuelle} — ${g.nb_pelerins} pèlerins`,
      colonnes: COLONNES_DETAIL_AGENCE,
      lignes,
      totaux,
    };
  };

  let exportProps;
  if (vueEffective === "associe") {
    exportProps = {
      titre: t("benefice_individuel"),
      sousTitre: associeAffiche ? `${associeAffiche.nom} — ${nomSaisonActuelle}` : nomSaisonActuelle,
      colonnes: COLONNES_ASSOCIE,
      lignes: lignesExportAssocie,
    };
  } else if (vueEffective === "agences") {
    exportProps = {
      titre: `${t("benefice_individuel")} — ${t("vue_agences", "Tableau 1 · Agences")}`,
      sousTitre: nomSaisonActuelle,
      colonnes: COLONNES_AGENCES,
      lignes: lignesExportAgences,
      totaux: totauxExportAgences,
    };
  } else {
    exportProps = {
      titre: `${t("benefice_individuel")} — ${estOumra ? t("vue_recapitulatif") : t("vue_associes_hajj", "Tableau 2 · Associés")}`,
      sousTitre: nomSaisonActuelle,
      colonnes: colonnesExportRecap,
      lignes: lignesExportRecap,
    };
  }

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("benefice_individuel")}</h1>
        <div className={styles.groupeBoutons}>
          {saisons.length > 0 && (
            <select value={saisonSelectionnee || ""} onChange={(e) => changerSaison(Number(e.target.value))} className={styles.selectAnnee}>
              {saisons.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          )}
          {vueEffective !== "agences" && <BoutonExporter {...exportProps} />}
        </div>
      </div>

      {donnees && (
        <>
          <p className={styles.tauxActuel}>
            {t("benefice_reel_global")} : {donnees.benefice_reel_global.gnf.toLocaleString("fr-FR")} GNF
          </p>

          {!estOumra && (
            <div className={styles.ongletsSection}>
              <button className={vue === "associe" ? styles.ongletActif : styles.onglet} onClick={() => setVue("associe")}>
                {t("vue_par_associe")}
              </button>
              <button className={vue === "agences" ? styles.ongletActif : styles.onglet} onClick={() => setVue("agences")}>
                {t("vue_agences", "Tableau 1 · Agences")}
              </button>
              <button className={vue === "recap" ? styles.ongletActif : styles.onglet} onClick={() => setVue("recap")}>
                {t("vue_associes_hajj", "Tableau 2 · Associés")}
              </button>
            </div>
          )}

          {vueEffective === "associe" && (
            <>
              <div className={styles.groupeBoutons} style={{ marginBottom: 18, flexWrap: "wrap" }}>
                {donnees.associes.map((a) => (
                  <button
                    key={a.associe_id}
                    className={Number(associeSelectionne) === Number(a.associe_id) ? styles.boutonPrincipal : styles.boutonSecondaire}
                    onClick={() => setAssocieSelectionne(Number(a.associe_id))}
                  >
                    {a.nom} ({a.pourcentage}%)
                  </button>
                ))}
              </div>

              {associeAffiche ? (
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
                      {associeAffiche.lignes.map((l, i) => (
                        <tr key={i} className={i === associeAffiche.lignes.length - 1 ? styles.ligneTotalRecap : ""}>
                          <td className={styles.cellCategorie}>{l.designation}</td>
                          <td className={styles.cellMontant}>{l.valeurs.gnf.toLocaleString("fr-FR")}</td>
                          <td className={styles.cellMontant}>{l.valeurs.usd.toLocaleString("fr-FR")}</td>
                          <td className={styles.cellMontant}>{l.valeurs.sar.toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.etatVide}>{t("aucun_associe_selectionne", "Aucun associé défini pour cette saison.")}</p>
              )}
            </>
          )}

          {vueEffective === "agences" && synthese && (
            <>
              <TableauAgences synthese={synthese} />

              <div style={{ background: "#fff", border: "1px solid #E7E2D6", borderRadius: 16, padding: "16px 20px", marginTop: 18 }}>
                <div style={{ fontWeight: 800, color: "#0F172A" }}>
                  📤 {t("exports_agences", "Exporter pour les agences")}
                </div>
                <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                  {t(
                    "exports_agences_aide",
                    "Ces exports ne montrent jamais les intérêts individuels des associés d'une autre agence. L'export de BATE VOYAGE GUINÉE détaille ses propres associés : à garder en interne."
                  )}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #E7E2D6" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t("export_trois_agences", "Les trois agences")}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      {t("export_trois_agences_aide", "Pèlerins et bénéfice de chaque agence, sans le détail des associés.")}
                    </div>
                  </div>
                  <BoutonExporter {...exportProps} />
                </div>

                {(synthese.groupes || []).map((g) => (
                  <div key={g.nom} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #E7E2D6" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.nom}</div>
                      <div style={{ fontSize: 12, color: g.nom === GROUPE_PRINCIPAL ? "#B45309" : "#6B7280" }}>
                        {g.nb_pelerins} {t("pelerins", "pèlerins")}
                        {g.nom === GROUPE_PRINCIPAL
                          ? ` · ${t("export_interne", "détail de ses associés — usage interne, à ne pas transmettre aux partenaires")}`
                          : ` · ${t("export_agence_aide", "bénéfice et part de ses associés uniquement")}`}
                      </div>
                    </div>
                    <BoutonExporter {...exportDeLAgence(g)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {vueEffective === "recap" && synthese && !estOumra && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#B45309" }}>
                🔒 {t("tableau2_interne", "Ce tableau et son export contiennent les intérêts individuels de tous les associés : usage interne. Pour les agences partenaires, utilisez le Tableau 1.")}
              </p>
              <TableauRepartitionAssocies synthese={synthese} />
            </>
          )}

          {vueEffective === "recap" && synthese && estOumra && (
            <div className={styles.conteneurRecap}>
              <table className={stylesInd.tableauSynthese}>
                <thead>
                  <tr>
                    <th className={stylesInd.colLibelle}>{t("designation")}</th>
                    {synthese.associes.map((a) => (
                      <th key={a.id}>
                        <span className={stylesInd.nomAssocie}>{a.nom}</span>
                        <span className={stylesInd.pctAssocie}>{a.pourcentage}%</span>
                      </th>
                    ))}
                    <th className={stylesInd.colTotal}>{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {synthese.lignes.map((l) => (
                    <tr key={l.cle} className={l.gras ? stylesInd.ligneNet : ""}>
                      <td className={stylesInd.colLibelle}>{t(`synthese_${l.cle}`)}</td>
                      {l.valeurs.map((v, i) => (
                        <td key={i}><CelluleMontant valeur={v} /></td>
                      ))}
                      <td className={stylesInd.colTotal}><CelluleMontant valeur={l.total} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!donnees && (
        <p className={styles.etatVide}>
          {t("aucune_saison_creee", "Aucune saison n'est créée pour cette activité. Créez-en une dans Décaissements (« Nouvelle saison »).")}
        </p>
      )}
    </div>
  );
}

export default PageBeneficeIndividuel;