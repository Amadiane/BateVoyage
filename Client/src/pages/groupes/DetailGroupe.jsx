import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus, Download, Users } from "lucide-react";
import { groupeService } from "../../services/groupeService";
import { pelerinService } from "../../services/pelerinService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import ModalAjoutPelerinsGroupe from "../../components/ModalAjoutPelerinsGroupe/ModalAjoutPelerinsGroupe";
import styles from "../../theme/pages/groupes/DetailGroupe.module.css";

function DetailGroupe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [groupe, setGroupe] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  const charger = () => {
    groupeService.obtenir(id).then(({ data }) => setGroupe(data));
    pelerinService.lister({ groupe: id }).then(({ data }) => {
      setPelerins(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [id]);

  const telechargerManifeste = () => {
    telechargerFichierProtege(groupeService.urlManifestePdf(id), `manifeste_${groupe?.nom}.pdf`);
  };

  const retirer = async (pelerinId) => {
    if (!window.confirm(t("confirmer_retrait_groupe"))) return;
    await groupeService.retirerPelerin(id, pelerinId);
    charger();
  };

  if (chargement || !groupe) return <p className={styles.chargement}>{t("chargement")}</p>;

  const placesRestantes = groupe.capacite_max ? groupe.capacite_max - pelerins.length : null;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate("/groupes")}>← {t("retour_liste")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{groupe.nom}</h1>
          <div className={styles.metaEntete}>
            <span className={styles.badgeEffectif}>
              <Users size={13} />
              {pelerins.length}{groupe.capacite_max ? ` / ${groupe.capacite_max}` : ""} {t("pelerins")}
            </span>
            {groupe.encadreur && <span className={styles.metaTexte}>👤 {groupe.encadreur}</span>}
          </div>
        </div>
        <div className={styles.groupeBoutons}>
          <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
            <UserPlus size={15} /> {t("ajouter_pelerins")}
          </button>
          <button className={styles.boutonSecondaire} onClick={telechargerManifeste}>
            <Download size={15} /> {t("telecharger_manifeste")}
          </button>
        </div>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("nom_complet")}</th>
              <th>{t("numero_passeport")}</th>
              <th>{t("telephone")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pelerins.length === 0 && (
              <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_pelerin_dans_groupe")}</td></tr>
            )}
            {pelerins.map((p) => (
              <tr key={p.id}>
                <td className={styles.cellId} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.numero_id}</td>
                <td className={styles.cellNom} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.prenom} {p.nom}</td>
                <td>{p.numero_passeport}</td>
                <td>{p.telephone}</td>
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
        <ModalAjoutPelerinsGroupe
          groupeId={Number(id)}
          placesRestantes={placesRestantes}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}
    </div>
  );
}

export default DetailGroupe;