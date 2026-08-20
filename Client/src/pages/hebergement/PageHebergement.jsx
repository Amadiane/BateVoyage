import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, MapPin, Bed, Users } from "lucide-react";
import { hotelService } from "../../services/hotelService";
import styles from "../../theme/pages/hebergement/PageHebergement.module.css";

const VALEURS_INITIALES = {
  nom: "", ville: "", adresse: "", telephone: "",
  date_debut_sejour: "", date_fin_sejour: "", cout_contrat: "", notes: "",
};

function PageHebergement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [hotelAModifier, setHotelAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    hotelService.lister().then(({ data }) => {
      setHotels(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const ouvrirNouveau = () => {
    setHotelAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (h, e) => {
    e.stopPropagation();
    setHotelAModifier(h);
    setValeurs({
      nom: h.nom, ville: h.ville, adresse: h.adresse || "", telephone: h.telephone || "",
      date_debut_sejour: h.date_debut_sejour || "", date_fin_sejour: h.date_fin_sejour || "",
      cout_contrat: h.cout_contrat || "", notes: h.notes || "",
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

      if (hotelAModifier) {
        await hotelService.modifier(hotelAModifier.id, donnees);
      } else {
        await hotelService.creer(donnees);
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
    if (!window.confirm(t("confirmer_suppression_hotel"))) return;
    await hotelService.supprimer(id);
    charger();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_hebergement")}</h1>
          <p className={styles.sousTitre}>{hotels.length} {t("hotels_enregistres")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouvel_hotel")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && hotels.length === 0 && <p className={styles.etatVide}>{t("aucun_hotel")}</p>}
        {!chargement && hotels.map((h) => (
          <div key={h.id} className={styles.carte} onClick={() => navigate(`/hebergement/${h.id}`)}>
            <div className={styles.bandeau}>
              <span className={`${styles.badgeVille} ${styles["ville_" + h.ville]}`}>
                <MapPin size={11} /> {t(`ville_${h.ville}`)}
              </span>
              <div className={styles.actions}>
                <button onClick={(e) => ouvrirModification(h, e)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={(e) => supprimer(h.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>

            <h3 className={styles.nom}>{h.nom}</h3>
            {h.adresse && <p className={styles.adresse}>{h.adresse}</p>}

            {(h.date_debut_sejour || h.date_fin_sejour) && (
              <p className={styles.dates}>📅 {h.date_debut_sejour} → {h.date_fin_sejour}</p>
            )}

            <div className={styles.stats}>
              <span className={styles.statItem}><Bed size={13} /> {h.nb_chambres} {t("chambres")}</span>
              <span className={styles.statItem}><Users size={13} /> {h.occupants_totaux}/{h.capacite_totale}</span>
            </div>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{hotelAModifier ? t("modifier_hotel") : t("nouvel_hotel")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_hotel")}</label>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("ville")}</label>
                <select value={valeurs.ville} onChange={(e) => majChamp("ville", e.target.value)} required>
                  <option value="">—</option>
                  <option value="mecque">{t("ville_mecque")}</option>
                  <option value="medine">{t("ville_medine")}</option>
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("adresse")}</label>
                <input value={valeurs.adresse} onChange={(e) => majChamp("adresse", e.target.value)} />
              </div>
              <div className={styles.champ}>
                <label>{t("telephone")}</label>
                <input value={valeurs.telephone} onChange={(e) => majChamp("telephone", e.target.value)} />
              </div>
              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("date_debut_sejour")}</label>
                  <input type="date" value={valeurs.date_debut_sejour} onChange={(e) => majChamp("date_debut_sejour", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("date_fin_sejour")}</label>
                  <input type="date" value={valeurs.date_fin_sejour} onChange={(e) => majChamp("date_fin_sejour", e.target.value)} />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("cout_contrat")}</label>
                <input type="number" step="0.01" value={valeurs.cout_contrat} onChange={(e) => majChamp("cout_contrat", e.target.value)} />
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

export default PageHebergement;