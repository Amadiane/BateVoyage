import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Users, Download } from "lucide-react";
import { volService } from "../../services/volService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import styles from "../../theme/pages/moduleVoyage/PageVolsModule.module.css";

const VALEURS_INITIALES = {
  compagnie: "", numero_vol: "", date_vol: "", heure_vol: "",
  aeroport_depart: "", aeroport_arrivee: "", numero_billet_reference: "", bagages_autorises_kg: "",
};

function PageVolsModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const ouvrirModification = (v, e) => {
    e.stopPropagation();
    setVolAModifier(v);
    setValeurs({
      compagnie: v.compagnie, numero_vol: v.numero_vol, date_vol: v.date_vol, heure_vol: v.heure_vol,
      aeroport_depart: v.aeroport_depart, aeroport_arrivee: v.aeroport_arrivee,
      numero_billet_reference: v.numero_billet_reference || "", bagages_autorises_kg: v.bagages_autorises_kg || "",
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

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_vol"))) return;
    await volService.supprimer(id);
    charger();
  };

  const exporterManifeste = (v, e) => {
    e.stopPropagation();
    telechargerFichierProtege(volService.urlManifestePdf(v.id), `manifeste_vol_${v.numero_vol}.pdf`);
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_vols")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_vol")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && vols.length === 0 && <p className={styles.etatVide}>{t("aucun_vol")}</p>}
        {!chargement && vols.map((v) => (
          <div
            key={v.id}
            className={styles.carte}
            onClick={() => navigate(`${basePath}/vols/${v.id}`)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.bandeau}>
              <span className={styles.numeroVol}>{v.compagnie} {v.numero_vol}</span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => ouvrirModification(v, e)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={(e) => supprimer(v.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>
            <p className={styles.trajet}>{v.aeroport_depart} → {v.aeroport_arrivee}</p>
            <p className={styles.dateHeure}>📅 {v.date_vol} — {v.heure_vol}</p>
            {v.numero_billet_reference && <p className={styles.reference}>PNR : {v.numero_billet_reference}</p>}
            <div className={styles.piedCarte}>
              <span className={styles.nbPassagers}><Users size={13} /> {v.nb_pelerins_affectes} {t("passagers")}</span>
              <button className={styles.boutonExport} onClick={(e) => exporterManifeste(v, e)}>
                <Download size={13} /> {t("manifeste")}
              </button>
            </div>
          </div>
        ))}
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
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("date_vol")}</label>
                  <input type="date" value={valeurs.date_vol} onChange={(e) => majChamp("date_vol", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("heure_vol")}</label>
                  <input type="time" value={valeurs.heure_vol} onChange={(e) => majChamp("heure_vol", e.target.value)} required />
                </div>
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("aeroport_depart")}</label>
                  <input value={valeurs.aeroport_depart} onChange={(e) => majChamp("aeroport_depart", e.target.value)} required placeholder="Conakry (CKY)" />
                </div>
                <div className={styles.champ}>
                  <label>{t("aeroport_arrivee")}</label>
                  <input value={valeurs.aeroport_arrivee} onChange={(e) => majChamp("aeroport_arrivee", e.target.value)} required placeholder="Djeddah (JED)" />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("numero_billet_reference")}</label>
                <input value={valeurs.numero_billet_reference} onChange={(e) => majChamp("numero_billet_reference", e.target.value)} placeholder="PNR (optionnel)" />
              </div>
              <div className={styles.champ}>
                <label>{t("bagages_autorises")}</label>
                <input type="number" min="0" value={valeurs.bagages_autorises_kg} onChange={(e) => majChamp("bagages_autorises_kg", e.target.value)} placeholder="Ex: 23" />
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

export default PageVolsModule;