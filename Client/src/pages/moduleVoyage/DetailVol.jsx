import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus, Download } from "lucide-react";
import { volService } from "../../services/volService";
import { groupeService } from "../../services/groupeService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import ModalAjoutPelerinsGroupe from "../../components/ModalAjoutPelerinsGroupe/ModalAjoutPelerinsGroupe";
import styles from "../../theme/pages/moduleVoyage/DetailVol.module.css";

function DetailVol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vol, setVol] = useState(null);
  const [groupe, setGroupe] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const charger = async () => {
    setChargement(true);
    const { data: volData } = await volService.obtenir(id);
    setVol(volData);

    const { data: groupes } = await groupeService.lister({ vol_aller: id });
    if (groupes.length > 0) {
      setGroupe(groupes[0]);
      const { data: pelerinsData } = await import("../../services/pelerinService").then((m) =>
        m.pelerinService.lister({ groupe: groupes[0].id })
      );
      setPelerins(pelerinsData);
    } else {
      setGroupe(null);
      setPelerins([]);
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, [id]);

  const creerGroupePourVol = async () => {
    setCreationEnCours(true);
    try {
      await groupeService.creer({ nom: `Groupe ${vol.numero_vol}`, vol_aller: id });
      charger();
    } finally {
      setCreationEnCours(false);
    }
  };

  const retirer = async (pelerinId) => {
    if (!window.confirm(t("confirmer_retrait_groupe"))) return;
    await groupeService.retirerPelerin(groupe.id, pelerinId);
    charger();
  };

  const telechargerManifeste = () => {
    telechargerFichierProtege(volService.urlManifestePdf(id), `manifeste_vol_${vol.numero_vol}.pdf`);
  };

  if (chargement || !vol) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(-1)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{vol.compagnie} {vol.numero_vol}</h1>
          <p className={styles.sousTitre}>{vol.aeroport_depart} → {vol.aeroport_arrivee} — {vol.date_vol} {vol.heure_vol}</p>
        </div>
        <button className={styles.boutonSecondaire} onClick={telechargerManifeste}>
          <Download size={15} /> {t("manifeste")}
        </button>
      </div>

      {!groupe ? (
        <div className={styles.carteVide}>
          <p className={styles.texteVide}>{t("aucun_groupe_pour_vol")}</p>
          <button className={styles.boutonPrincipal} onClick={creerGroupePourVol} disabled={creationEnCours}>
            {creationEnCours ? t("enregistrement") : t("creer_groupe_pour_vol")}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.enteteGroupe}>
            <span className={styles.nomGroupe}>{groupe.nom}</span>
            <button className={styles.boutonSecondaire} onClick={() => setModalOuverte(true)}>
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
                  <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_pelerin_dans_groupe")}</td></tr>
                )}
                {pelerins.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.cellId} onClick={() => navigate(`/pelerins/${p.id}`)} style={{ cursor: "pointer" }}>{p.numero_id}</td>
                    <td onClick={() => navigate(`/pelerins/${p.id}`)} style={{ cursor: "pointer" }}>{p.prenom} {p.nom}</td>
                    <td>{p.numero_passeport}</td>
                    <td>
                      <button className={styles.boutonRetirer} onClick={() => retirer(p.id)} title={t("retirer_du_groupe")}>
                        <UserMinus size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOuverte && groupe && (
        <ModalAjoutPelerinsGroupe
          groupeId={groupe.id}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}
    </div>
  );
}

export default DetailVol;