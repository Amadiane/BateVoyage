import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { decaissementService } from "../../services/decaissementService";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

function PageBeneficeIndividuel({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saisons, setSaisons] = useState([]);
  const [saisonSelectionnee, setSaisonSelectionnee] = useState(null);
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [associeSelectionne, setAssocieSelectionne] = useState(null);

  const charger = async (idSaison) => {
    if (!idSaison) { setDonnees(null); return; }
    const { data } = await decaissementService.obtenirBeneficeIndividuel(activite, idSaison);
    setDonnees(data);
    // Sélectionne toujours le premier associé après un rechargement,
    // pour éviter qu'un ID sélectionné avant ne correspondre à rien.
    if (data.associes.length > 0) {
      setAssocieSelectionne(Number(data.associes[0].associe_id));
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

  // Comparaison explicitement forcée en nombre des deux côtés — évite tout
  // échec silencieux de .find() dû à une différence string/number.
  const associeAffiche = donnees?.associes.find(
    (a) => Number(a.associe_id) === Number(associeSelectionne)
  );

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("benefice_individuel")}</h1>
        {saisons.length > 0 && (
          <select value={saisonSelectionnee || ""} onChange={(e) => changerSaison(Number(e.target.value))} className={styles.selectAnnee}>
            {saisons.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        )}
      </div>

      {donnees && (
        <>
          <p className={styles.tauxActuel}>
            {t("benefice_reel_global")} : {donnees.benefice_reel_global.gnf.toLocaleString("fr-FR")} GNF
          </p>

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
    </div>
  );
}

export default PageBeneficeIndividuel;