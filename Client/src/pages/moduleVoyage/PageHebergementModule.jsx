import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Building2, Bed, Users } from "lucide-react";
import { villeService } from "../../services/villeService";
import { hotelService } from "../../services/hotelService";
import styles from "../../theme/pages/moduleVoyage/PageHebergementModule.module.css";

const VALEURS_VILLE_INITIALES = { nom: "" };
const VALEURS_HOTEL_INITIALES = {
  nom: "", ville: "", adresse: "", categorie: "", distance_haram_metres: "",
  nombre_chambres_prevu: "", telephone: "", date_debut_sejour: "", date_fin_sejour: "",
};

function PageHebergementModule({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [villes, setVilles] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [villeActive, setVilleActive] = useState(null);

  const [modalVilleOuverte, setModalVilleOuverte] = useState(false);
  const [villeAModifier, setVilleAModifier] = useState(null);
  const [valeursVille, setValeursVille] = useState(VALEURS_VILLE_INITIALES);

  const [modalHotelOuverte, setModalHotelOuverte] = useState(false);
  const [hotelAModifier, setHotelAModifier] = useState(null);
  const [valeursHotel, setValeursHotel] = useState(VALEURS_HOTEL_INITIALES);

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    Promise.all([villeService.lister(), hotelService.lister()]).then(([villesRes, hotelsRes]) => {
      setVilles(villesRes.data);
      setHotels(hotelsRes.data);
      if (villesRes.data.length > 0 && !villeActive) setVilleActive(villesRes.data[0].id);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  // ---------- Villes ----------
  const ouvrirNouvelleVille = () => {
    setVilleAModifier(null);
    setValeursVille(VALEURS_VILLE_INITIALES);
    setErreur("");
    setModalVilleOuverte(true);
  };

  const ouvrirModifVille = (v, e) => {
    e.stopPropagation();
    setVilleAModifier(v);
    setValeursVille({ nom: v.nom });
    setErreur("");
    setModalVilleOuverte(true);
  };

  const soumettreVille = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      if (villeAModifier) {
        await villeService.modifier(villeAModifier.id, valeursVille);
      } else {
        await villeService.creer(valeursVille);
      }
      setModalVilleOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimerVille = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_ville"))) return;
    await villeService.supprimer(id);
    if (villeActive === id) setVilleActive(null);
    charger();
  };

  // ---------- Hôtels ----------
  const ouvrirNouvelHotel = () => {
    setHotelAModifier(null);
    setValeursHotel({ ...VALEURS_HOTEL_INITIALES, ville: villeActive || "" });
    setErreur("");
    setModalHotelOuverte(true);
  };

  const ouvrirModifHotel = (h, e) => {
    e.stopPropagation();
    setHotelAModifier(h);
    setValeursHotel({
      nom: h.nom, ville: h.ville, adresse: h.adresse || "", categorie: h.categorie || "",
      distance_haram_metres: h.distance_haram_metres || "", nombre_chambres_prevu: h.nombre_chambres_prevu || "",
      telephone: h.telephone || "", date_debut_sejour: h.date_debut_sejour || "", date_fin_sejour: h.date_fin_sejour || "",
    });
    setErreur("");
    setModalHotelOuverte(true);
  };

  const soumettreHotel = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = { ...valeursHotel };
      Object.keys(donnees).forEach((k) => { if (donnees[k] === "") delete donnees[k]; });
      if (hotelAModifier) {
        await hotelService.modifier(hotelAModifier.id, donnees);
      } else {
        await hotelService.creer(donnees);
      }
      setModalHotelOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimerHotel = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_hotel"))) return;
    await hotelService.supprimer(id);
    charger();
  };

  const hotelsFiltres = villeActive ? hotels.filter((h) => h.ville === villeActive) : hotels;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
  <h1 className={styles.titre}>{t("sous_module_hebergement")}</h1>
  <div className={styles.groupeBoutonsEntete}>
    <button className={styles.boutonSecondaire} onClick={() => navigate(`${basePath}/campements`)}>
      ⛺ {t("sous_module_campements")}
    </button>
    <button className={styles.boutonPrincipal} onClick={ouvrirNouvelleVille}>
      <Plus size={16} /> {t("nouvelle_ville")}
    </button>
  </div>
</div>
      <div className={styles.ongletsVilles}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && villes.length === 0 && <p className={styles.etatVide}>{t("aucune_ville")}</p>}
        {!chargement && villes.map((v) => (
          <div
            key={v.id}
            className={villeActive === v.id ? styles.ongletVilleActif : styles.ongletVille}
            onClick={() => setVilleActive(v.id)}
          >
            <span>{v.nom}</span>
            <span className={styles.compteurVille}>{v.nb_hotels}</span>
            <div className={styles.actionsVille} onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => ouvrirModifVille(v, e)} title={t("modifier")}><Pencil size={11} /></button>
              <button onClick={(e) => supprimerVille(v.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>

      {!chargement && villes.length > 0 && (
        <>
          <div className={styles.enteteHotels}>
            <h2 className={styles.sousTitreVille}>{villes.find((v) => v.id === villeActive)?.nom}</h2>
            <button className={styles.boutonSecondaire} onClick={ouvrirNouvelHotel}>
              <Plus size={15} /> {t("nouvel_hotel")}
            </button>
          </div>

          <div className={styles.grilleCartes}>
            {hotelsFiltres.length === 0 && <p className={styles.etatVide}>{t("aucun_hotel")}</p>}
            {hotelsFiltres.map((h) => (
              <div key={h.id} className={styles.carte} onClick={() => navigate(`${basePath}/hebergement/${h.id}`)}>
                <div className={styles.bandeau}>
                  <span className={styles.nomHotel}><Building2 size={14} /> {h.nom}</span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => ouvrirModifHotel(h, e)} title={t("modifier")}><Pencil size={13} /></button>
                    <button onClick={(e) => supprimerHotel(h.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                  </div>
                </div>
                {h.categorie_display && <span className={styles.badgeCategorie}>{h.categorie_display}</span>}
                {h.adresse && <p className={styles.adresse}>{h.adresse}</p>}
                {h.distance_haram_metres && <p className={styles.distance}>📍 {h.distance_haram_metres}m du Haram</p>}
                {(h.date_debut_sejour || h.date_fin_sejour) && (
                  <p className={styles.dates}>📅 {h.date_debut_sejour} → {h.date_fin_sejour}</p>
                )}
                <div className={styles.stats}>
                  <span className={styles.statItem}><Bed size={13} /> {h.nb_chambres} {t("chambres")}</span>
                  <span className={styles.statItem}><Users size={13} /> {h.occupants_totaux}/{h.capacite_totale}</span>
                </div>
                {h.nb_erreurs > 0 && (
                  <p className={styles.alerteErreurs}>⚠️ {h.nb_erreurs} {t("chambres_avec_erreur")}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {modalVilleOuverte && (
        <div className={styles.superposition} onClick={() => setModalVilleOuverte(false)}>
          <div className={styles.panneauEtroit} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{villeAModifier ? t("modifier_ville") : t("nouvelle_ville")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalVilleOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={soumettreVille} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_ville")}</label>
                <input value={valeursVille.nom} onChange={(e) => setValeursVille({ nom: e.target.value })} required placeholder="Mecque" />
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalVilleOuverte(false)}>{t("annuler")}</button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHotelOuverte && (
        <div className={styles.superposition} onClick={() => setModalHotelOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{hotelAModifier ? t("modifier_hotel") : t("nouvel_hotel")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalHotelOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={soumettreHotel} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_hotel")}</label>
                <input value={valeursHotel.nom} onChange={(e) => setValeursHotel({ ...valeursHotel, nom: e.target.value })} required />
              </div>
              <div className={styles.champ}>
                <label>{t("ville")}</label>
                <select value={valeursHotel.ville} onChange={(e) => setValeursHotel({ ...valeursHotel, ville: e.target.value })} required>
                  <option value="">—</option>
                  {villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("adresse")}</label>
                <input value={valeursHotel.adresse} onChange={(e) => setValeursHotel({ ...valeursHotel, adresse: e.target.value })} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("categorie")}</label>
                  <select value={valeursHotel.categorie} onChange={(e) => setValeursHotel({ ...valeursHotel, categorie: e.target.value })}>
                    <option value="">—</option>
                    <option value="economique">{t("categorie_economique")}</option>
                    <option value="standard">{t("categorie_standard")}</option>
                    <option value="superieur">{t("categorie_superieur")}</option>
                    <option value="luxe">{t("categorie_luxe")}</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("distance_haram")}</label>
                  <input type="number" min="0" value={valeursHotel.distance_haram_metres} onChange={(e) => setValeursHotel({ ...valeursHotel, distance_haram_metres: e.target.value })} placeholder="Ex: 500" />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("nombre_chambres_prevu")}</label>
                <input type="number" min="0" value={valeursHotel.nombre_chambres_prevu} onChange={(e) => setValeursHotel({ ...valeursHotel, nombre_chambres_prevu: e.target.value })} placeholder="Ex: 60" />
              </div>
              <div className={styles.champ}>
                <label>{t("telephone")}</label>
                <input value={valeursHotel.telephone} onChange={(e) => setValeursHotel({ ...valeursHotel, telephone: e.target.value })} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("date_debut_sejour")}</label>
                  <input type="date" value={valeursHotel.date_debut_sejour} onChange={(e) => setValeursHotel({ ...valeursHotel, date_debut_sejour: e.target.value })} />
                </div>
                <div className={styles.champ}>
                  <label>{t("date_fin_sejour")}</label>
                  <input type="date" value={valeursHotel.date_fin_sejour} onChange={(e) => setValeursHotel({ ...valeursHotel, date_fin_sejour: e.target.value })} />
                </div>
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalHotelOuverte(false)}>{t("annuler")}</button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageHebergementModule;