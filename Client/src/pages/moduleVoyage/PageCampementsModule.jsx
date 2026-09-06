import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Users } from "lucide-react";
import { campementService } from "../../services/campementService";
import { villeService } from "../../services/villeService";
import styles from "../../theme/pages/moduleVoyage/PageCampementsModule.module.css";

const VALEURS_INITIALES = { ville: "", tente_camp: "", groupe: "", zone: "", affectation: "", capacite: "", notes: "" };

function PageCampementsModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [campements, setCampements] = useState([]);
  const [villes, setVilles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [campementAModifier, setCampementAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    campementService.lister().then(({ data }) => {
      setCampements(data);
      setChargement(false);
    });
  };

  useEffect(() => {
    charger();
    villeService.lister().then(({ data }) => setVilles(data));
  }, []);

  const ouvrirNouveau = () => {
    setCampementAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (c, e) => {
    e.stopPropagation();
    setCampementAModifier(c);
    setValeurs({
      ville: c.ville, tente_camp: c.tente_camp, groupe: c.groupe || "",
      zone: c.zone || "", affectation: c.affectation || "", capacite: c.capacite || "", notes: c.notes || "",
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
      if (campementAModifier) {
        await campementService.modifier(campementAModifier.id, donnees);
      } else {
        await campementService.creer(donnees);
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
    if (!window.confirm(t("confirmer_suppression_campement"))) return;
    await campementService.supprimer(id);
    charger();
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_campements")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_campement")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && campements.length === 0 && <p className={styles.etatVide}>{t("aucun_campement")}</p>}
        {!chargement && campements.map((c) => (
          <div key={c.id} className={styles.carte} onClick={() => navigate(`${basePath}/campements/${c.id}`)}>
            <div className={styles.bandeau}>
              <span className={styles.tenteCamp}>⛺ {c.tente_camp}</span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => ouvrirModification(c, e)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={(e) => supprimer(c.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>
            <p className={styles.ville}>{c.ville_nom}</p>
            {c.groupe && <p className={styles.info}>{t("groupe")} : {c.groupe}</p>}
            {c.zone && <p className={styles.info}>{t("zone")} : {c.zone}</p>}
            {c.affectation && <p className={styles.info}>{t("affectation")} : {c.affectation}</p>}
            <div className={styles.piedCarte}>
              <span className={styles.effectif}>
                <Users size={13} />
                {c.occupants_actuels}{c.capacite ? ` / ${c.capacite}` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{campementAModifier ? t("modifier_campement") : t("nouveau_campement")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("ville")}</label>
                <select value={valeurs.ville} onChange={(e) => majChamp("ville", e.target.value)} required>
                  <option value="">—</option>
                  {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("tente_camp")}</label>
                <input value={valeurs.tente_camp} onChange={(e) => majChamp("tente_camp", e.target.value)} required placeholder="Ex: T-12A" />
              </div>
              <div className={styles.champ}>
                <label>{t("groupe")}</label>
                <input value={valeurs.groupe} onChange={(e) => majChamp("groupe", e.target.value)} placeholder="Ex: Groupe Hajj B" />
              </div>
              <div className={styles.champ}>
                <label>{t("zone")}</label>
                <input value={valeurs.zone} onChange={(e) => majChamp("zone", e.target.value)} placeholder="Ex: Zone 3, Secteur B" />
              </div>
              <div className={styles.champ}>
                <label>{t("affectation")}</label>
                <input value={valeurs.affectation} onChange={(e) => majChamp("affectation", e.target.value)} placeholder="Ex: Bloc Nord — Rangée 4" />
              </div>
              <div className={styles.champ}>
                <label>{t("capacite_max")}</label>
                <input type="number" min="1" value={valeurs.capacite} onChange={(e) => majChamp("capacite", e.target.value)} />
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

export default PageCampementsModule;