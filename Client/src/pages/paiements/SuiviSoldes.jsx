import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { paiementService } from "../../services/paiementService";
import styles from "../../theme/pages/paiements/SuiviSoldes.module.css";

function SuiviSoldes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState(null);
  const [ongletActif, setOngletActif] = useState("en_retard");

  useEffect(() => {
    paiementService.obtenirSuiviSoldes().then(({ data }) => setDonnees(data));
  }, []);

  if (!donnees) return <p className={styles.chargement}>{t("chargement")}</p>;

  const listeActive = donnees[ongletActif] || [];

  return (
    <div>
      <div className={styles.cartesResume}>
        <button className={`${styles.carteOnglet} ${styles.carteRouge} ${ongletActif === "en_retard" ? styles.actif : ""}`} onClick={() => setOngletActif("en_retard")}>
          <span className={styles.chiffre}>{donnees.en_retard?.length || 0}</span>
          <span className={styles.label}>{t("statut_paiement_en_retard")}</span>
        </button>
        <button className={`${styles.carteOnglet} ${styles.carteJaune} ${ongletActif === "a_surveiller" ? styles.actif : ""}`} onClick={() => setOngletActif("a_surveiller")}>
          <span className={styles.chiffre}>{donnees.a_surveiller?.length || 0}</span>
          <span className={styles.label}>{t("statut_paiement_a_surveiller")}</span>
        </button>
        <button className={`${styles.carteOnglet} ${styles.carteVerte} ${ongletActif === "complet" ? styles.actif : ""}`} onClick={() => setOngletActif("complet")}>
          <span className={styles.chiffre}>{donnees.complet?.length || 0}</span>
          <span className={styles.label}>{t("statut_paiement_complet")}</span>
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        {listeActive.length === 0 ? (
          <p className={styles.etatVide}>{t("aucun_resultat")}</p>
        ) : (
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("nom_complet")}</th>
                <th>{t("programme")}</th>
                <th>{t("montant_total_verse")}</th>
                <th>{t("jours_avant_depart")}</th>
              </tr>
            </thead>
            <tbody>
              {listeActive.map((p) => (
                <tr key={p.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${p.id}`)}>
                  <td className={styles.cellId}>{p.numero_id}</td>
                  <td>{p.nom_complet}</td>
                  <td>{p.programme || "—"}</td>
                  <td>{parseFloat(p.montant_total_verse).toLocaleString("fr-FR")} GNF</td>
                  <td>{p.jours_avant_depart !== null ? `${p.jours_avant_depart} j` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SuiviSoldes;