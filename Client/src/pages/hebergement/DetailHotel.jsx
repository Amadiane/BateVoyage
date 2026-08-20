import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";
import { hotelService } from "../../services/hotelService";
import { chambreService } from "../../services/chambreService";
import styles from "../../theme/pages/hebergement/DetailHotel.module.css";

const VALEURS_INITIALES = { numero: "", type_chambre: "" };

function DetailHotel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hotel, setHotel] = useState(null);
  const [chambres, setChambres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [chambreAModifier, setChambreAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    hotelService.obtenir(id).then(({ data }) => setHotel(data));
    chambreService.lister({ hotel: id }).then(({ data }) => {
      setChambres(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [id]);

  const ouvrirNouveau = () => {
    setChambreAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (c) => {
    setChambreAModifier(c);
    setValeurs({ numero: c.numero, type_chambre: c.type_chambre });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = { ...valeurs, hotel: id };
      if (chambreAModifier) {
        await chambreService.modifier(chambreAModifier.id, donnees);
      } else {
        await chambreService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      const donneesErreur = err.response?.data;
      if (donneesErreur?.non_field_errors) {
        setErreur(t("numero_chambre_deja_utilise"));
      } else {
        setErreur(t("erreur_enregistrement"));
      }
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (chambreId) => {
    if (!window.confirm(t("confirmer_suppression_chambre"))) return;
    await chambreService.supprimer(chambreId);
    charger();
  };

  if (chargement || !hotel) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate("/hebergement")}>← {t("retour_liste")}</button>

      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{hotel.nom}</h1>
          <p className={styles.sousTitre}>{t(`ville_${hotel.ville}`)} — {chambres.length} {t("chambres")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouvelle_chambre")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chambres.length === 0 && <p className={styles.etatVide}>{t("aucune_chambre")}</p>}
        {chambres.map((c) => (
          <div key={c.id} className={styles.carteChambre} onClick={() => navigate(`/hebergement/chambre/${c.id}`)}>
            <div className={styles.bandeau}>
              <span className={styles.numeroChambre}>Ch. {c.numero}</span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => ouvrirModification(c)} title={t("modifier")}><Pencil size={12} /></button>
                <button onClick={() => supprimer(c.id)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={12} /></button>
              </div>
            </div>
            <p className={styles.typeChambre}>{t(`type_${c.type_chambre}`)}</p>
            <div className={styles.occupation}>
              <Users size={13} />
              <span className={c.places_restantes === 0 ? styles.complet : styles.disponible}>
                {c.occupants_actuels}/{c.capacite}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{chambreAModifier ? t("modifier_chambre") : t("nouvelle_chambre")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("numero_chambre")}</label>
                <input value={valeurs.numero} onChange={(e) => majChamp("numero", e.target.value)} required placeholder="101" />
              </div>
              <div className={styles.champ}>
                <label>{t("type_chambre_label")}</label>
                <select value={valeurs.type_chambre} onChange={(e) => majChamp("type_chambre", e.target.value)} required>
                  <option value="">—</option>
                  <option value="individuelle">{t("type_individuelle")}</option>
                  <option value="double">{t("type_double")}</option>
                  <option value="triple">{t("type_triple")}</option>
                  <option value="quadruple">{t("type_quadruple")}</option>
                </select>
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

export default DetailHotel;