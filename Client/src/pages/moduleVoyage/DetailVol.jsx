import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus, Download } from "lucide-react";
import { volService } from "../../services/volService";
import { groupeService } from "../../services/groupeService";
import { pelerinService } from "../../services/pelerinService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import ModalAjoutPelerinsGroupe from "../../components/ModalAjoutPelerinsGroupe/ModalAjoutPelerinsGroupe";
import styles from "../../theme/pages/moduleVoyage/DetailVol.module.css";

function DetailVol({ basePath }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vol, setVol] = useState(null);
  const [groupe, setGroupe] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [tousGroupes, setTousGroupes] = useState([]);
  const [groupeSelectionne, setGroupeSelectionne] = useState("");
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const charger = async () => {
    setChargement(true);
    const { data: volData } = await volService.obtenir(id);
    setVol(volData);

    const { data: groupesData } = await groupeService.lister();
    setTousGroupes(groupesData);

    const groupeLie = groupesData.find((g) => String(g.vol_aller) === String(id) || String(g.vol_retour) === String(id));

    if (groupeLie) {
      setGroupe(groupeLie);
      const { data: pelerinsData } = await pelerinService.lister({ groupe: groupeLie.id });
      setPelerins(pelerinsData);
    } else {
      setGroupe(null);
      setPelerins([]);
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, [id]);

  const lierGroupeExistant = async () => {
    if (!groupeSelectionne) return;
    setCreationEnCours(true);
    try {
      await groupeService.modifier(groupeSelectionne, { vol_aller: id });
      setGroupeSelectionne("");
      charger();
    } finally {
      setCreationEnCours(false);
    }
  };

  const delierGroupe = async () => {
    if (!window.confirm(t("confirmer_detachement_vol"))) return;
    await groupeService.modifier(groupe.id, { vol_aller: null });
    charger();
  };

  const retirer = async (pelerinId) => {
    if (!window.confirm(t("confirmer_retrait_groupe"))) return;
    await groupeService.retirerPelerin(groupe.id, pelerinId);
    charger();
  };

  const telechargerManifeste = () => {
    telechargerFichierProtege(volService.urlManifestePdf(id), `manifeste_vol_${vol.numero_vol}.pdf`);
  };

  const cheminGroupes = basePath ? `${basePath}/groupes` : "/hajj/groupes";

  if (chargement || !vol) return <p className={styles.chargement}>{t("chargement")}</p>;

  const placesRestantesGroupe = groupe && groupe.capacite_max ? groupe.capacite_max - pelerins.length : null;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(-1)}>← {t("retour")}</button>
      <div className={`${styles.bandeauPhase} ${vol.type_vol === "aller" ? styles.bandeauPhaseAller : styles.bandeauPhaseRetour}`}>
        {vol.type_vol === "aller" ? t("phase_aller") : t("phase_retour")}
      </div>

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
          <div className={styles.choixLiaison}>
            <select className={styles.selectLiaison} value={groupeSelectionne} onChange={(e) => setGroupeSelectionne(e.target.value)}>
              <option value="">{t("selectionner_groupe_existant")}</option>
              {tousGroupes.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
            <button className={styles.boutonPrincipal} onClick={lierGroupeExistant} disabled={!groupeSelectionne || creationEnCours}>
              {creationEnCours ? t("enregistrement") : t("lier_ce_groupe")}
            </button>
          </div>
          <p className={styles.texteAlternatif}>
            {t("ou")}{" "}
            <button className={styles.lienTexte} onClick={() => navigate(cheminGroupes)}>
              {t("creer_nouveau_groupe_module")}
            </button>
          </p>
        </div>
      ) : (
        <>
          <div className={styles.enteteGroupe}>
            <span className={styles.nomGroupe}>
              {groupe.nom}
              {groupe.capacite_max && <span className={styles.effectifGroupe}> ({pelerins.length}/{groupe.capacite_max})</span>}
            </span>
            <div className={styles.actionsGroupe}>
              <button className={styles.boutonSecondaire} onClick={() => setModalOuverte(true)}>
                <UserPlus size={15} /> {t("ajouter_pelerins")}
              </button>
              <button className={styles.boutonLienDetacher} onClick={delierGroupe}>
                {t("detacher_du_vol")}
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
          placesRestantes={placesRestantesGroupe}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}
    </div>
  );
}

export default DetailVol;