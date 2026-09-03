import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Users } from "lucide-react";
import { groupeService } from "../../services/groupeService";
import { volService } from "../../services/volService";
import styles from "../../theme/pages/moduleVoyage/PageGroupesModule.module.css";

const VALEURS_INITIALES = { nom: "", sensVol: "", volId: "", encadreur: "", capacite_max: "", notes: "" };

function PageGroupesModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [vols, setVols] = useState([]);
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
    let sensVol = "";
    let volId = "";
    if (g.vol_aller) { sensVol = "aller"; volId = g.vol_aller; }
    else if (g.vol_retour) { sensVol = "retour"; volId = g.vol_retour; }
    setValeurs({
      nom: g.nom, sensVol, volId, encadreur: g.encadreur || "", capacite_max: g.capacite_max || "", notes: g.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const majSensVol = (sens) => setValeurs((v) => ({ ...v, sensVol: sens, volId: "" }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = {
        nom: valeurs.nom,
        encadreur: valeurs.encadreur,
        capacite_max: valeurs.capacite_max || null,
        notes: valeurs.notes,
        vol_aller: valeurs.sensVol === "aller" ? valeurs.volId : null,
        vol_retour: valeurs.sensVol === "retour" ? valeurs.volId : null,
      };
      Object.keys(donnees).forEach((k) => { if (donnees[k] === "") donnees[k] = null; });

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

              {g.vol_aller_detail && <p className={styles.infoVol}>✈️ {t("vol_aller")} : {g.vol_aller_detail.compagnie} {g.vol_aller_detail.numero_vol}</p>}
              {g.vol_retour_detail && <p className={styles.infoVol}>✈️ {t("vol_retour")} : {g.vol_retour_detail.compagnie} {g.vol_retour_detail.numero_vol}</p>}
              {g.encadreur && <p className={styles.encadreur}>👤 {g.encadreur}</p>}

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
                <label>{t("type_vol_label")}</label>
                <div className={styles.choixSensVol}>
                  <button
                    type="button"
                    className={valeurs.sensVol === "aller" ? styles.boutonTypeActif : styles.boutonType}
                    onClick={() => majSensVol("aller")}
                  >
                    {t("vol_aller")}
                  </button>
                  <button
                    type="button"
                    className={valeurs.sensVol === "retour" ? styles.boutonTypeActif : styles.boutonType}
                    onClick={() => majSensVol("retour")}
                  >
                    {t("vol_retour")}
                  </button>
                  <button
                    type="button"
                    className={valeurs.sensVol === "" ? styles.boutonTypeActif : styles.boutonType}
                    onClick={() => majSensVol("")}
                  >
                    {t("aucun")}
                  </button>
                </div>
              </div>

              {valeurs.sensVol && (
                <div className={styles.champ}>
                  <label>{valeurs.sensVol === "aller" ? t("vol_aller") : t("vol_retour")}</label>
                  <select value={valeurs.volId} onChange={(e) => majChamp("volId", e.target.value)}>
                    <option value="">—</option>
                    {vols.filter((v) => v.type_vol === valeurs.sensVol).map((v) => (
                      <option key={v.id} value={v.id}>{v.compagnie} {v.numero_vol} — {v.date_vol}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.champ}>
                <label>{t("encadreur")}</label>
                <input value={valeurs.encadreur} onChange={(e) => majChamp("encadreur", e.target.value)} placeholder={t("saisir_nom_encadreur")} />
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