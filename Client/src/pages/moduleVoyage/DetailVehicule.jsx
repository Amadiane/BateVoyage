import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserPlus, UserMinus, UsersRound } from "lucide-react";
import { vehiculeService } from "../../services/vehiculeService";
import { pelerinService } from "../../services/pelerinService";
import { groupeService } from "../../services/groupeService";
import ModalAjoutPelerinsVehicule from "../../components/ModalAjoutPelerinsVehicule/ModalAjoutPelerinsVehicule";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/moduleVoyage/DetailVehicule.module.css";

function DetailVehicule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vehicule, setVehicule] = useState(null);
  const [pelerins, setPelerins] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [groupeSelectionne, setGroupeSelectionne] = useState("");
  const [envoiGroupe, setEnvoiGroupe] = useState(false);
  const [erreurGroupe, setErreurGroupe] = useState("");
  const [pelerinARetirer, setPelerinARetirer] = useState(null);

  const charger = async () => {
    setChargement(true);
    const { data: vehiculeData } = await vehiculeService.obtenir(id);
    setVehicule(vehiculeData);
    const { data: pelerinsData } = await pelerinService.lister({ vehicule: id });
    setPelerins(pelerinsData);
    const { data: groupesData } = await groupeService.lister();
    setGroupes(groupesData);
    setChargement(false);
  };

  useEffect(() => { charger(); }, [id]);

  const demanderRetrait = (pelerin) => setPelerinARetirer(pelerin);

  const confirmerRetrait = async () => {
    await vehiculeService.retirerPelerin(id, pelerinARetirer.id);
    setPelerinARetirer(null);
    charger();
  };

  const affecterGroupeEntier = async () => {
    if (!groupeSelectionne) return;
    setEnvoiGroupe(true);
    setErreurGroupe("");
    try {
      await vehiculeService.affecterGroupe(id, groupeSelectionne);
      setGroupeSelectionne("");
      charger();
    } catch (err) {
      setErreurGroupe(err.response?.data?.erreur || t("erreur_enregistrement"));
    } finally {
      setEnvoiGroupe(false);
    }
  };

  if (chargement || !vehicule) return <p className={styles.chargement}>{t("chargement")}</p>;

  const placesRestantes = vehicule.capacite ? vehicule.capacite - pelerins.length : null;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(-1)}>← {t("retour_liste")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>🚌 {vehicule.numero_bus}</h1>
          <p className={styles.sousTitre}>
            {vehicule.type_vehicule_display}
            {vehicule.chauffeur && ` — ${t("chauffeur")} : ${vehicule.chauffeur}`}
            {vehicule.trajet && ` — ${vehicule.trajet}`}
          </p>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
          <UserPlus size={15} /> {t("ajouter_pelerins")}
        </button>
      </div>

      <div className={styles.blocGroupe}>
        <UsersRound size={15} className={styles.iconeGroupe} />
        <select value={groupeSelectionne} onChange={(e) => setGroupeSelectionne(e.target.value)} className={styles.selectGroupe}>
          <option value="">{t("affecter_groupe_entier")}</option>
          {groupes.map((g) => <option key={g.id} value={g.id}>{g.nom} ({g.nb_pelerins})</option>)}
        </select>
        <button className={styles.boutonSecondaire} onClick={affecterGroupeEntier} disabled={!groupeSelectionne || envoiGroupe}>
          {envoiGroupe ? t("enregistrement") : t("affecter")}
        </button>
      </div>
      {erreurGroupe && <p className={styles.erreurGroupe}>{erreurGroupe}</p>}

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
              <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_pelerin_dans_vehicule")}</td></tr>
            )}
            {pelerins.map((p) => (
              <tr key={p.id}>
                <td className={styles.cellId} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.numero_id}</td>
                <td className={styles.cellNom} onClick={() => navigate(`/pelerins/${p.id}`)}>{p.prenom} {p.nom}</td>
                <td>{p.numero_passeport}</td>
                <td className={styles.cellActions}>
                  <button className={styles.boutonRetirer} onClick={() => demanderRetrait(p)} title={t("retirer_du_vehicule")}>
                    <UserMinus size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <ModalAjoutPelerinsVehicule
          vehiculeId={Number(id)}
          placesRestantes={placesRestantes}
          onFermer={() => setModalOuverte(false)}
          onAjoute={charger}
        />
      )}

      {pelerinARetirer && (
        <ModalConfirmation
          titre={t("confirmer_retrait_titre")}
          message={t("confirmer_retrait_vehicule_message", { nom: `${pelerinARetirer.prenom} ${pelerinARetirer.nom}` })}
          onConfirmer={confirmerRetrait}
          onAnnuler={() => setPelerinARetirer(null)}
        />
      )}
    </div>
  );
}

export default DetailVehicule;