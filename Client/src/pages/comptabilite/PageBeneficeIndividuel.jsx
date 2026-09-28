import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import { telechargerFichierProtege } from "../../utils/telechargement";
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
  const [exportEnCours, setExportEnCours] = useState(false);

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

  const exporterPdf = async () => {
    if (!saisonSelectionnee) return;
    const nomSaison = saisons.find((s) => s.id === saisonSelectionnee)?.nom || "saison";
    setExportEnCours(true);
    try {
      await telechargerFichierProtege(
        decaissementService.urlSynthesePdf(activite, saisonSelectionnee),
        `benefices_${nomSaison}.pdf`
      );
    } finally {
      setExportEnCours(false);
    }
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  // Comparaison forcée en nombre des deux côtés : évite tout échec silencieux
  // de .find() dû à une différence string/number.
  const associeAffiche = donnees?.associes.find(
    (a) => Number(a.associe_id) === Number(associeSelectionne)
  );

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
          <button className={styles.boutonPrincipal} onClick={exporterPdf} disabled={exportEnCours || !synthese}>
            <Download size={15} /> {exportEnCours ? t("generation_pdf") : t("exporter_pdf")}
          </button>
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