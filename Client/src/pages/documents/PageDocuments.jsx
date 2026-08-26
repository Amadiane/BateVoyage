import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileWarning, Clock3, Calendar } from "lucide-react";
import { documentService } from "../../services/documentService";
import styles from "../../theme/pages/documents/PageDocuments.module.css";

function PageDocuments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [ongletActif, setOngletActif] = useState("dossiers_incomplets");

  useEffect(() => {
    documentService.obtenirTableauBord().then(({ data }) => {
      setDonnees(data);
      setChargement(false);
    });
  }, []);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  const listesParOnglet = {
    dossiers_incomplets: donnees.dossiers_incomplets || [],
    passeports_a_surveiller: donnees.passeports_a_surveiller || [],
    visas_en_attente: donnees.visas_en_attente || [],
  };

  const listeActive = listesParOnglet[ongletActif];

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_documents")}</h1>
      <p className={styles.sousTitre}>{t("documents_description")}</p>

      <div className={styles.cartesStat}>
        <button
          className={`${styles.carteStat} ${ongletActif === "dossiers_incomplets" ? styles.carteActive : ""}`}
          onClick={() => setOngletActif("dossiers_incomplets")}
        >
          <div className={`${styles.iconeCercle} ${styles.cercleOrange}`}>
            <FileWarning size={18} />
          </div>
          <div>
            <p className={styles.chiffreStat}>{donnees.total_dossiers_incomplets}</p>
            <p className={styles.labelStat}>{t("dossiers_incomplets")}</p>
          </div>
        </button>

        <button
          className={`${styles.carteStat} ${ongletActif === "passeports_a_surveiller" ? styles.carteActive : ""}`}
          onClick={() => setOngletActif("passeports_a_surveiller")}
        >
          <div className={`${styles.iconeCercle} ${styles.cercleRouge}`}>
            <Clock3 size={18} />
          </div>
          <div>
            <p className={styles.chiffreStat}>{listesParOnglet.passeports_a_surveiller.length}</p>
            <p className={styles.labelStat}>{t("passeports_a_surveiller")}</p>
          </div>
        </button>

        <button
          className={`${styles.carteStat} ${ongletActif === "visas_en_attente" ? styles.carteActive : ""}`}
          onClick={() => setOngletActif("visas_en_attente")}
        >
          <div className={`${styles.iconeCercle} ${styles.cercleOr}`}>
            <Calendar size={18} />
          </div>
          <div>
            <p className={styles.chiffreStat}>{listesParOnglet.visas_en_attente.length}</p>
            <p className={styles.labelStat}>{t("visas_en_attente")}</p>
          </div>
        </button>
      </div>

      <div className={styles.onglets}>
        <button
          className={ongletActif === "dossiers_incomplets" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("dossiers_incomplets")}
        >
          {t("dossiers_incomplets")} ({listesParOnglet.dossiers_incomplets.length})
        </button>
        <button
          className={ongletActif === "passeports_a_surveiller" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("passeports_a_surveiller")}
        >
          {t("passeports_a_surveiller")} ({listesParOnglet.passeports_a_surveiller.length})
        </button>
        <button
          className={ongletActif === "visas_en_attente" ? styles.ongletActif : styles.onglet}
          onClick={() => setOngletActif("visas_en_attente")}
        >
          {t("visas_en_attente")} ({listesParOnglet.visas_en_attente.length})
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
                <th>{t("elements_manquants")}</th>
              </tr>
            </thead>
            <tbody>
              {listeActive.map((p) => (
                <tr key={p.id} className={styles.ligneCliquable} onClick={() => navigate(`/pelerins/${p.id}`)}>
                  <td className={styles.cellId}>{p.numero_id}</td>
                  <td>{p.prenom} {p.nom}</td>
                  <td>
                    {(p.elements_manquants || []).map((e) => (
                      <span key={e} className={styles.badgeManquant}>{e}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PageDocuments;