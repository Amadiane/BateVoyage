import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, Users, Plane } from "lucide-react";
import { groupeService } from "../../services/groupeService";
import { volService } from "../../services/volService";
import { programmeService } from "../../services/programmeService";
import { utilisateurService } from "../../services/utilisateurService";
import styles from "../../theme/pages/groupes/OngletGroupes.module.css";

const VALEURS_INITIALES = {
  nom: "", programme: "", vol_aller: "", vol_retour: "", encadreur: "", notes: "",
};

function OngletGroupes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [vols, setVols] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [encadreurs, setEncadreurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [groupeAModifier, setGroupeAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    groupeService.lister().then(({ data }) => {
      setGroupes(data);
      setChargement(false);
    });
  };

  useEffect(() => {
    charger();
    volService.lister().then(({ data }) => setVols(data));
    programmeService.lister().then(({ data }) => setProgrammes(data));
    utilisateurService.listerComptes().then(({ data }) => {
  const rolesAutorises = ["guide", "encadreur", "mounazim"];
  setEncadreurs(data.filter((u) => rolesAutorises.includes(u.role)));
}).catch(() => setEncadreurs([]));
  }, []);

  const ouvrirNouveau = () => {
    setGroupeAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (g) => {
    setGroupeAModifier(g);
    setValeurs({
      nom: g.nom, programme: g.programme || "", vol_aller: g.vol_aller || "",
      vol_retour: g.vol_retour || "", encadreur: g.encadreur || "", notes: g.notes || "",
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
      const donnees = { ...valeurs };
      Object.keys(donnees).forEach((k) => { if (donnees[k] === "") delete donnees[k]; });

      if (groupeAModifier) {
        await groupeService.modifier(groupeAModifier.id, donnees);
      } else {
        await groupeService.creer(donnees);
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
    if (!window.confirm(t("confirmer_suppression_groupe"))) return;
    await groupeService.supprimer(id);
    charger();
  };

  return (
    <div>
      <div className={styles.entete}>
        <p className={styles.sousTitre}>{groupes.length} {t("groupes_enregistres")}</p>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_groupe")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && groupes.length === 0 && <p className={styles.etatVide}>{t("aucun_groupe")}</p>}
        {!chargement && groupes.map((g) => (
          <div key={g.id} className={styles.carte}>
            <div className={styles.bandeau}>
              <h3 className={styles.nom}>{g.nom}</h3>
              <div className={styles.actions}>
                <button onClick={() => ouvrirModification(g)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={() => supprimer(g.id)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>

            {g.programme_nom && <p className={styles.programme}>{g.programme_nom}</p>}

            {g.vol_aller_detail && (
              <div className={styles.ligneVol}>
                <Plane size={13} className={styles.iconeVol} />
                <span>{t("aller")} : {g.vol_aller_detail.compagnie} {g.vol_aller_detail.numero_vol} — {g.vol_aller_detail.date_vol}</span>
              </div>
            )}
            {g.vol_retour_detail && (
              <div className={styles.ligneVol}>
                <Plane size={13} className={styles.iconeVolRetour} />
                <span>{t("retour")} : {g.vol_retour_detail.compagnie} {g.vol_retour_detail.numero_vol} — {g.vol_retour_detail.date_vol}</span>
              </div>
            )}

            {g.encadreur_nom && <p className={styles.encadreur}>{t("encadreur")} : {g.encadreur_nom}</p>}

            <div className={styles.piedCarte}>
              <span className={styles.nbPelerins}><Users size={13} /> {g.nb_pelerins} {t("pelerins")}</span>
              <button className={styles.lienVoir} onClick={() => navigate(`/groupes/${g.id}`)}>
                {t("voir_manifeste")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{groupeAModifier ? t("modifier_groupe") : t("nouveau_groupe")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_groupe")}</label>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required placeholder="Groupe Hajj A" />
              </div>
              <div className={styles.champ}>
                <label>{t("programme")}</label>
                <select value={valeurs.programme} onChange={(e) => majChamp("programme", e.target.value)}>
                  <option value="">—</option>
                  {programmes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("vol_aller")}</label>
                <select value={valeurs.vol_aller} onChange={(e) => majChamp("vol_aller", e.target.value)}>
                  <option value="">—</option>
                  {vols.map((v) => <option key={v.id} value={v.id}>{v.compagnie} {v.numero_vol} — {v.date_vol}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("vol_retour")}</label>
                <select value={valeurs.vol_retour} onChange={(e) => majChamp("vol_retour", e.target.value)}>
                  <option value="">—</option>
                  {vols.map((v) => <option key={v.id} value={v.id}>{v.compagnie} {v.numero_vol} — {v.date_vol}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("encadreur")}</label>
                <select value={valeurs.encadreur} onChange={(e) => majChamp("encadreur", e.target.value)}>
                  <option value="">—</option>
                  {encadreurs.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role_display})</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("notes")}</label>
                <textarea rows={2} value={valeurs.notes} onChange={(e) => majChamp("notes", e.target.value)} />
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

export default OngletGroupes;