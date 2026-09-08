import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Users, Bus } from "lucide-react";
import { vehiculeService } from "../../services/vehiculeService";
import styles from "../../theme/pages/moduleVoyage/PageTransportModule.module.css";

const VALEURS_INITIALES = {
  numero_bus: "", type_vehicule: "bus", plaque_immatriculation: "", capacite: "",
  chauffeur: "", telephone_chauffeur: "", trajet: "",
  date_debut_utilisation: "", date_fin_utilisation: "", cout_location: "", notes: "",
};

function PageTransportModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreType, setFiltreType] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [vehiculeAModifier, setVehiculeAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    const params = {};
    if (filtreType) params.type_vehicule = filtreType;
    vehiculeService.lister(params).then(({ data }) => {
      setVehicules(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [filtreType]);

  const ouvrirNouveau = () => {
    setVehiculeAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (v, e) => {
    e.stopPropagation();
    setVehiculeAModifier(v);
    setValeurs({
      numero_bus: v.numero_bus, type_vehicule: v.type_vehicule, plaque_immatriculation: v.plaque_immatriculation || "",
      capacite: v.capacite || "", chauffeur: v.chauffeur || "", telephone_chauffeur: v.telephone_chauffeur || "",
      trajet: v.trajet || "", date_debut_utilisation: v.date_debut_utilisation || "", date_fin_utilisation: v.date_fin_utilisation || "",
      cout_location: v.cout_location || "", notes: v.notes || "",
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
      if (vehiculeAModifier) {
        await vehiculeService.modifier(vehiculeAModifier.id, donnees);
      } else {
        await vehiculeService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      const donneesErreur = err.response?.data;
      if (donneesErreur?.numero_bus) {
        setErreur(t("numero_bus_deja_utilise"));
      } else {
        setErreur(t("erreur_enregistrement"));
      }
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_vehicule"))) return;
    await vehiculeService.supprimer(id);
    charger();
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_transport")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_vehicule")}
        </button>
      </div>

      <div className={styles.barreOutils}>
        <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_types_vehicule")}</option>
          <option value="bus">{t("type_bus")}</option>
          <option value="minibus">{t("type_minibus")}</option>
          <option value="voiture">{t("type_voiture")}</option>
          <option value="autre">{t("type_autre")}</option>
        </select>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && vehicules.length === 0 && <p className={styles.etatVide}>{t("aucun_vehicule")}</p>}
        {!chargement && vehicules.map((v) => {
          const tauxRemplissage = v.capacite ? Math.min(100, Math.round((v.occupants_actuels / v.capacite) * 100)) : null;
          return (
            <div key={v.id} className={styles.carte} onClick={() => navigate(`${basePath}/transport/${v.id}`)}>
              <div className={styles.bandeau}>
                <span className={styles.numeroBus}><Bus size={16} /> {v.numero_bus}</span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => ouvrirModification(v, e)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={(e) => supprimer(v.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                </div>
              </div>
              <span className={styles.badgeType}>{v.type_vehicule_display}</span>
              {v.chauffeur && <p className={styles.info}>👤 {v.chauffeur}</p>}
              {v.trajet && <p className={styles.info}>🛣️ {v.trajet}</p>}
              <div className={styles.piedCarte}>
                <span className={styles.effectif}>
                  <Users size={13} />
                  {v.occupants_actuels}{v.capacite ? ` / ${v.capacite}` : ""}
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
              <h2>{vehiculeAModifier ? t("modifier_vehicule") : t("nouveau_vehicule")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("numero_bus")} *</label>
                <input value={valeurs.numero_bus} onChange={(e) => majChamp("numero_bus", e.target.value)} required placeholder="Bus 01" />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("type_vehicule_label")}</label>
                  <select value={valeurs.type_vehicule} onChange={(e) => majChamp("type_vehicule", e.target.value)}>
                    <option value="bus">{t("type_bus")}</option>
                    <option value="minibus">{t("type_minibus")}</option>
                    <option value="voiture">{t("type_voiture")}</option>
                    <option value="autre">{t("type_autre")}</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("capacite")}</label>
                  <input type="number" min="1" value={valeurs.capacite} onChange={(e) => majChamp("capacite", e.target.value)} placeholder="Ex: 50" />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("plaque_immatriculation")}</label>
                <input value={valeurs.plaque_immatriculation} onChange={(e) => majChamp("plaque_immatriculation", e.target.value)} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("chauffeur")}</label>
                  <input value={valeurs.chauffeur} onChange={(e) => majChamp("chauffeur", e.target.value)} placeholder={t("saisir_nom_chauffeur")} />
                </div>
                <div className={styles.champ}>
                  <label>{t("telephone_chauffeur")}</label>
                  <input value={valeurs.telephone_chauffeur} onChange={(e) => majChamp("telephone_chauffeur", e.target.value)} />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("trajet")}</label>
                <input value={valeurs.trajet} onChange={(e) => majChamp("trajet", e.target.value)} placeholder="Ex: Hôtel Makkah → Haram" />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("date_debut_utilisation")}</label>
                  <input type="date" value={valeurs.date_debut_utilisation} onChange={(e) => majChamp("date_debut_utilisation", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("date_fin_utilisation")}</label>
                  <input type="date" value={valeurs.date_fin_utilisation} onChange={(e) => majChamp("date_fin_utilisation", e.target.value)} />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("cout_location")} (GNF)</label>
                <input type="number" min="0" value={valeurs.cout_location} onChange={(e) => majChamp("cout_location", e.target.value)} />
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

export default PageTransportModule;