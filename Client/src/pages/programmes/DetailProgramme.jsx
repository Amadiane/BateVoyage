import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus, Archive } from "lucide-react";
import { programmeService } from "../../services/programmeService";
import { pelerinService } from "../../services/pelerinService";
import ModalAjoutPelerinsProgramme from "../../components/ModalAjoutPelerinsProgramme/ModalAjoutPelerinsProgramme";
import styles from "../../theme/pages/programmes/DetailProgramme.module.css";

function DetailProgramme() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [programme, setProgramme] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  const charger = () => {
    programmeService.obtenir(id).then(({ data }) => setProgramme(data));
    pelerinService.lister({ programme: id }).then(({ data }) => {
      setPelerins(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [id]);

  const retirer = async (pelerinId) => {
    if (!window.confirm(t("confirmer_retrait_activite"))) return;
    await programmeService.retirerPelerin(id, pelerinId);
    charger();
  };

  if (chargement || !programme) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate("/programmes")}>← {t("retour_liste")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{programme.nom}</h1>
          <p className={styles.sousTitre}>
            {t(`type_${programme.type_programme}`)} {programme.annee} — {pelerins.length} {t("pelerins")}
            {programme.est_archive && (
              <span className={styles.badgeArchiveInline}><Archive size={11} /> {t("archive")}</span>
            )}
          </p>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
          <UserPlus size={15} /> {t("ajouter_pelerins")}
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("nom_complet")}</th>
              <th>{t("telephone")}</th>
              <th>{t("statut")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pelerins.length === 0 && (
              <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_pelerin_dans_activite")}</td></tr>
            )}
            {pelerins.map((p) => (
              <tr key={p.id}>
                <td className={styles.cellId} onClick={() => navigate(`/pelerins/${p.id}`)} style={{ cursor: "pointer" }}>{p.numero_id}</td>
                <td onClick={() => navigate(`/pelerins/${p.id}`)} style={{ cursor: "pointer" }}>{p.prenom} {p.nom}</td>
                <td>{p.telephone}</td>
                <td>{t(`statut_${p.statut}`)}</td>
                <td>
                  <button className={styles.boutonRetirer} onClick={() => retirer(p.id)} title={t("retirer_de_activite")}>
                    <UserMinus size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <ModalAjoutPelerinsProgramme
          programmeId={Number(id)}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}
    </div>
  );
}

export default DetailProgramme;