import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus } from "lucide-react";
import { campementService } from "../../services/campementService";
import { pelerinService } from "../../services/pelerinService";
import ModalAjoutPelerinsCampement from "../../components/ModalAjoutPelerinsCampement/ModalAjoutPelerinsCampement";
import styles from "../../theme/pages/moduleVoyage/DetailCampement.module.css";

function DetailCampement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [campement, setCampement] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  const charger = () => {
    campementService.lister().then(({ data }) => {
      const trouve = data.find((c) => String(c.id) === String(id));
      setCampement(trouve || null);
    });
    pelerinService.lister({ campement: id }).then(({ data }) => {
      setPelerins(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [id]);

  const retirer = async (pelerinId) => {
    if (!window.confirm(t("confirmer_retrait_campement"))) return;
    await campementService.retirerPelerin(id, pelerinId);
    charger();
  };

  if (chargement || !campement) return <p className={styles.chargement}>{t("chargement")}</p>;

  const placesRestantes = campement.capacite ? campement.capacite - pelerins.length : null;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(-1)}>← {t("retour_liste")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>⛺ {campement.tente_camp}</h1>
          <p className={styles.sousTitre}>
            {campement.ville_nom}
            {campement.zone && ` — ${t("zone")} : ${campement.zone}`}
            {campement.groupe && ` — ${t("groupe")} : ${campement.groupe}`}
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
              <th>{t("numero_passeport")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pelerins.length === 0 && (
              <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_pelerin_dans_campement")}</td></tr>
            )}
            {pelerins.map((p) => (
              <tr key={p.id}>
                <td className={styles.cellId} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.numero_id}</td>
                <td className={styles.cellNom} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.prenom} {p.nom}</td>
                <td>{p.numero_passeport}</td>
                <td className={styles.cellActions}>
                  <button className={styles.boutonRetirer} onClick={() => retirer(p.id)} title={t("retirer_du_groupe")}>
                    <UserMinus size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <ModalAjoutPelerinsCampement
          campementId={Number(id)}
          placesRestantes={placesRestantes}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}
    </div>
  );
}

export default DetailCampement;