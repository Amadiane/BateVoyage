import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decaissementService } from "../../services/decaissementService";
import BoutonExporter from "../../components/export/BoutonExporter";
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
          { cle: `assoc_${i}_gnf`, entete: `${a.nom} (GNF)`, largeur: 16, format: "nombre" },
          { cle: `assoc_${i}_usd`, entete: `${a.nom} (USD)`, largeur: 12, format: "nombre" },
          { cle: `assoc_${i}_sar`, entete: `${a.nom} (SAR)`, largeur: 12, format: "nombre" },
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

  const exportProps = vue === "associe"
    ? {
        titre: t("benefice_individuel"),
        sousTitre: associeAffiche ? `${associeAffiche.nom} — ${nomSaisonActuelle}` : nomSaisonActuelle,
        colonnes: COLONNES_ASSOCIE,
        lignes: lignesExportAssocie,
      }
    : {
        titre: `${t("benefice_individuel")} — ${t("vue_recapitulatif")}`,
        sousTitre: nomSaisonActuelle,
        colonnes: colonnesExportRecap,
        lignes: lignesExportRecap,
      };

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
          <BoutonExporter {...exportProps} />
        </div>
      </div>

      {donnees && (
        <>
          <p className={styles.tauxActuel}>
            {t("benefice_reel_global")} : {donnees.benefice_reel_global.gnf.toLocaleString("fr-FR")} GNF
          </p>

          <div className={styles.ongletsSection}>
            <button className={vue === "associe" ? styles.ongletActif : styles.onglet} onClick={() => setVue("associe")}>
              {t("vue_par_associe")}
            </button>
            <button className={vue === "recap" ? styles.ongletActif : styles.onglet} onClick={() => setVue("recap")}>
              {t("vue_recapitulatif")}
            </button>
          </div>

          {vue === "associe" && (
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
                <p className={styles.etatVide}>{t("aucun_associe_selectionne")}</p>
              )}
            </>
          )}

          {vue === "recap" && synthese && (
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
    </div>
  );
}

export default PageBeneficeIndividuel;