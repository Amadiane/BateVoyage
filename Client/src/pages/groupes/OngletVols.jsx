import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { volService } from "../../services/volService";
import styles from "../../theme/pages/groupes/OngletVols.module.css";

const VALEURS_INITIALES = {
  compagnie: "", numero_vol: "", date_vol: "", heure_vol: "",
  aeroport_depart: "", aeroport_arrivee: "",
};

function OngletVols() {
  const { t } = useTranslation();
  const [vols, setVols] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [volAModifier, setVolAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    volService.lister().then(({ data }) => {
      setVols(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const ouvrirNouveau = () => {
    setVolAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (v) => {
    setVolAModifier(v);
    setValeurs({
      compagnie: v.compagnie, numero_vol: v.numero_vol, date_vol: v.date_vol,
      heure_vol: v.heure_vol, aeroport_depart: v.aeroport_depart, aeroport_arrivee: v.aeroport_arrivee,
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      if (volAModifier) {
        await volService.modifier(volAModifier.id, valeurs);
      } else {
        await volService.creer(valeurs);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression_vol"))) return;
    await volService.supprimer(id);
    charger();
  };

  return (
    <div>
      <div className={styles.entete}>
        <p className={styles.sousTitre}>{vols.length} {t("vols_enregistres")}</p>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_vol")}
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("compagnie")}</th>
              <th>{t("numero_vol")}</th>
              <th>{t("date_heure")}</th>
              <th>{t("trajet")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={5} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && vols.length === 0 && <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_vol")}</td></tr>}
            {!chargement && vols.map((v) => (
              <tr key={v.id}>
                <td>{v.compagnie}</td>
                <td className={styles.cellNumero}>{v.numero_vol}</td>
                <td>{v.date_vol} — {v.heure_vol}</td>
                <td>{v.aeroport_depart} → {v.aeroport_arrivee}</td>
                <td className={styles.cellActions}>
                  <button onClick={() => ouvrirModification(v)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={() => supprimer(v.id)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{volAModifier ? t("modifier_vol") : t("nouveau_vol")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("compagnie")}</label>
                <input value={valeurs.compagnie} onChange={(e) => majChamp("compagnie", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("numero_vol")}</label>
                <input value={valeurs.numero_vol} onChange={(e) => majChamp("numero_vol", e.target.value)} required />
              </div>
              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("date_vol")}</label>
                  <input type="date" value={valeurs.date_vol} onChange={(e) => majChamp("date_vol", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("heure_vol")}</label>
                  <input type="time" value={valeurs.heure_vol} onChange={(e) => majChamp("heure_vol", e.target.value)} required />
                </div>
              </div>
              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("aeroport_depart")}</label>
                  <input value={valeurs.aeroport_depart} onChange={(e) => majChamp("aeroport_depart", e.target.value)} required placeholder="Conakry (CKY)" />
                </div>
                <div className={styles.champ}>
                  <label>{t("aeroport_arrivee")}</label>
                  <input value={valeurs.aeroport_arrivee} onChange={(e) => majChamp("aeroport_arrivee", e.target.value)} required placeholder="Djeddah (JED)" />
                </div>
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OngletVols;