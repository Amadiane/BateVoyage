import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { documentService } from "../../services/documentService";
import styles from "../../theme/pages/documents/PageDocuments.module.css";

const LABEL_CHAMP = {
  numero_passeport: "champ_numero_passeport",
  scan_passeport: "champ_scan_passeport",
  visa: "champ_visa",
  scan_certificat_medical: "champ_certificat_medical",
  photo: "champ_photo",
};

function PageDocuments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState("incomplets");

  useEffect(() => {
    documentService.obtenirTableauBord().then(({ data }) => {
      setDonnees(data);
      setChargement(false);
    });
  }, []);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_documents")}</h1>
      <p className={styles.sousTitre}>{t("suivi_conformite_dossiers")}</p>

      <div className={styles.cartesResume}>
        <div className={styles.carteResume}>
          <p className={styles.chiffreResume}>{donnees.total_dossiers_incomplets}</p>
          <p className={styles.labelResume}>{t("dossiers_incomplets")}</p>
        </div>
        <div className={styles.carteResume}>
          <p className={styles.chiffreResume}>{donnees.passeports_expirant.length}</p>
          <p className={styles.labelResume}>{t("passeports_a_surveiller")}</p>
        </div>
        <div className={styles.carteResume}>
          <p className={styles.chiffreResume}>{donnees.visas_en_attente.length}</p>
          <p className={styles.labelResume}>{t("visas_en_attente")}</p>
        </div>
      </div>

      <div className={styles.onglets}>
        <button
          className={ongletActif === "incomplets" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("incomplets")}
        >
          {t("dossiers_incomplets")} ({donnees.dossiers_incomplets.length})
        </button>
        <button
          className={ongletActif === "passeports" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("passeports")}
        >
          {t("passeports_a_surveiller")} ({donnees.passeports_expirant.length})
        </button>
        <button
          className={ongletActif === "visas" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("visas")}
        >
          {t("visas_en_attente")} ({donnees.visas_en_attente.length})
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        {ongletActif === "incomplets" && (
          donnees.dossiers_incomplets.length === 0 ? (
            <p className={styles.etatVide}>{t("aucun_dossier_incomplet")}</p>
          ) : (
            <table className={styles.tableau}>
              <thead>
                <tr>
                  <th>{t("id")}</th>
                  <th>{t("nom_complet")}</th>
                  <th>{t("champs_manquants")}</th>
                </tr>
              </thead>
              <tbody>
                {donnees.dossiers_incomplets.map((d) => (
                  <tr key={d.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${d.id}`)}>
                    <td className={styles.cellId}>{d.numero_id}</td>
                    <td>{d.nom_complet}</td>
                    <td>
                      <div className={styles.badgesManquants}>
                        {d.champs_manquants.map((champ) => (
                          <span key={champ} className={styles.badgeManquant}>
                            {t(LABEL_CHAMP[champ])}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {ongletActif === "passeports" && (
          donnees.passeports_expirant.length === 0 ? (
            <p className={styles.etatVide}>{t("aucun_passeport_a_surveiller")}</p>
          ) : (
            <table className={styles.tableau}>
              <thead>
                <tr>
                  <th>{t("id")}</th>
                  <th>{t("nom_complet")}</th>
                  <th>{t("date_expiration_passeport")}</th>
                  <th>{t("statut")}</th>
                </tr>
              </thead>
              <tbody>
                {donnees.passeports_expirant.map((p) => (
                  <tr key={p.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${p.id}`)}>
                    <td className={styles.cellId}>{p.numero_id}</td>
                    <td>{p.nom_complet}</td>
                    <td>{p.date_expiration_passeport}</td>
                    <td>
                      <span className={p.deja_expire ? styles.badgeDanger : styles.badgeAvertissement}>
                        {p.deja_expire ? t("deja_expire") : t("expire_bientot")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {ongletActif === "visas" && (
          donnees.visas_en_attente.length === 0 ? (
            <p className={styles.etatVide}>{t("aucun_visa_en_attente")}</p>
          ) : (
            <table className={styles.tableau}>
              <thead>
                <tr>
                  <th>{t("id")}</th>
                  <th>{t("nom_complet")}</th>
                  <th>{t("statut_visa_label")}</th>
                </tr>
              </thead>
              <tbody>
                {donnees.visas_en_attente.map((v) => (
                  <tr key={v.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${v.id}`)}>
                    <td className={styles.cellId}>{v.numero_id}</td>
                    <td>{v.nom_complet}</td>
                    <td>
                      <span className={styles.badgeAvertissement}>{t(`visa_${v.statut_visa}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}

export default PageDocuments;