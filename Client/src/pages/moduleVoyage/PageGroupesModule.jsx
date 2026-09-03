import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Users } from "lucide-react";
import { groupeService } from "../../services/groupeService";
import { programmeService } from "../../services/programmeService";
import { volService } from "../../services/volService";
import styles from "../../theme/pages/moduleVoyage/PageGroupesModule.module.css";

const VALEURS_INITIALES = { nom: "", programme: "", vol_aller: "", vol_retour: "", encadreur: "", capacite_max: "", notes: "" };

function PageGroupesModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [vols, setVols] = useState([]);
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
    programmeService.lister().then(({ data }) => setProgrammes(data));
    volService.lister().then(({ data }) => setVols(data));
    groupeService.listerEncadreursDisponibles().then(({ data }) => setEncadreurs(data));
  }, []);

  const ouvrirNouveau = () => {
    setGroupeAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (g, e) => {
    e.stopPropagation();
    setGroupeAModifier(g);
    setValeurs({
      nom: g.nom, programme: g.programme || "", vol_aller: g.vol_aller || "", vol_retour: g.vol_retour || "",
      encadreur: g.encadreur || "", capacite_max: g.capacite_max || "", notes: g.notes || "",
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

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_groupe"))) return;
    await groupeService.supprimer(id);
    charger();
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_groupes")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_groupe")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && groupes.length === 0 && <p className={styles.etatVide}>{t("aucun_groupe")}</p>}
        {!chargement && groupes.map((g) => {
          const tauxRemplissage = g.capacite_max ? Math.min(100, Math.round((g.nb_pelerins / g.capacite_max) * 100)) : null;
          return (
            <div key={g.id} className={styles.carte} onClick={() => navigate(`${basePath}/groupes/${g.id}`)}>
              <div className={styles.bandeau}>
                <span className={styles.nomGroupe}>{g.nom}</span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => ouvrirModification(g, e)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={(e) => supprimer(g.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                </div>
              </div>

              {g.programme_nom && <p className={styles.programme}>{g.programme_nom}</p>}
              {g.encadreur_nom && <p className={styles.encadreur}>👤 {g.encadreur_nom}</p>}

              <div className={styles.piedCarte}>
                <span className={styles.effectif}>
                  <Users size={13} />
                  {g.nb_pelerins}{g.capacite_max ? ` / ${g.capacite_max}` : ""}
                </span>
              </div>

              {tauxRemplissage !== null && (
                <div className={styles.barreProgression}>
                  <div
                    className={`${styles.barreRemplie} ${tauxRemplissage >= 100 ? styles.barreComplete : ""}`}
                    style={{ width: `${tauxRemplissage}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
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
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("vol_aller")}</label>
                  <select value={valeurs.vol_aller} onChange={(e) => majChamp("vol_aller", e.target.value)}>
                    <option value="">—</option>
                    {vols.filter((v) => v.type_vol === "aller").map((v) => <option key={v.id} value={v.id}>{v.compagnie} {v.numero_vol}</option>)}
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("vol_retour")}</label>
                  <select value={valeurs.vol_retour} onChange={(e) => majChamp("vol_retour", e.target.value)}>
                    <option value="">—</option>
                    {vols.filter((v) => v.type_vol === "retour").map((v) => <option key={v.id} value={v.id}>{v.compagnie} {v.numero_vol}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("encadreur")}</label>
                <select value={valeurs.encadreur} onChange={(e) => majChamp("encadreur", e.target.value)}>
                  <option value="">—</option>
                  {encadreurs.map((u) => <option key={u.id} value={u.id}>{u.nom} ({u.role_display})</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("capacite_max")}</label>
                <input type="number" min="1" value={valeurs.capacite_max} onChange={(e) => majChamp("capacite_max", e.target.value)} placeholder="Ex: 45" />
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

export default PageGroupesModule;