import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, CalendarDays, Clock, Wallet } from "lucide-react";
import { programmeService } from "../../services/programmeService";
import styles from "../../theme/pages/programmes/ListeProgrammes.module.css";

const VALEURS_INITIALES = {
  nom: "", type_programme: "", date_depart: "", date_retour: "",
  date_limite_paiement: "", prix: "",
};

function ListeProgrammes() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [programmeAModifier, setProgrammeAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    programmeService.lister().then(({ data }) => {
      setProgrammes(data);
      setChargement(false);
    });
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirNouveau = () => {
    setProgrammeAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (p) => {
    setProgrammeAModifier(p);
    setValeurs({
      nom: p.nom,
      type_programme: p.type_programme,
      date_depart: p.date_depart,
      date_retour: p.date_retour,
      date_limite_paiement: p.date_limite_paiement || "",
      prix: p.prix || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, valeur) => setValeurs((v) => ({ ...v, [champ]: valeur }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = { ...valeurs };
      Object.keys(donnees).forEach((k) => {
        if (donnees[k] === "") delete donnees[k];
      });

      if (programmeAModifier) {
        await programmeService.modifier(programmeAModifier.id, donnees);
      } else {
        await programmeService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      const donneesErreur = err.response?.data;
      if (donneesErreur && typeof donneesErreur === "object") {
        const messages = Object.entries(donneesErreur)
          .map(([champ, msgs]) => `${champ} : ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`)
          .join(" — ");
        setErreur(messages || t("erreur_enregistrement"));
      } else {
        setErreur(t("erreur_enregistrement"));
      }
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression_programme"))) return;
    await programmeService.supprimer(id);
    charger();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_programmes")}</h1>
          <p className={styles.sousTitre}>{programmes.length} {t("programmes_enregistres")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_programme")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && programmes.length === 0 && (
          <p className={styles.etatVide}>{t("aucun_programme")}</p>
        )}
        {!chargement && programmes.map((p) => (
          <div key={p.id} className={styles.carteProgramme}>
            <div className={styles.bandeauCarte}>
              <span className={`${styles.badgeType} ${styles["type_" + p.type_programme]}`}>
                {t(`type_${p.type_programme}`)}
              </span>
              <div className={styles.actionsCarte}>
                <button onClick={() => ouvrirModification(p)} title={t("modifier")}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => supprimer(p.id)} title={t("supprimer")} className={styles.boutonSupprimer}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <h3 className={styles.nomProgramme}>{p.nom}</h3>

            <div className={styles.ligneInfo}>
              <CalendarDays size={14} className={styles.iconeInfo} />
              <span>{p.date_depart} → {p.date_retour}</span>
            </div>

            {p.prix && (
              <div className={styles.ligneInfo}>
                <Wallet size={14} className={styles.iconeInfo} />
                <span>{parseFloat(p.prix).toLocaleString("fr-FR")} GNF</span>
              </div>
            )}

            {p.date_limite_paiement && (
              <div className={styles.echeancePaiement}>
                <Clock size={13} />
                <span>{t("echeance_paiement")} : {p.date_limite_paiement}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{programmeAModifier ? t("modifier_programme") : t("nouveau_programme")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_programme")}</label>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required placeholder="Hajj 2027 — Groupe A" />
              </div>

              <div className={styles.champ}>
                <label>{t("type_programme_label")}</label>
                <select value={valeurs.type_programme} onChange={(e) => majChamp("type_programme", e.target.value)} required>
                  <option value="">—</option>
                  <option value="hajj">{t("type_hajj")}</option>
                  <option value="oumra_ramadan">{t("type_oumra_ramadan")}</option>
                  <option value="oumra_classique">{t("type_oumra_classique")}</option>
                </select>
              </div>

              <div className={styles.sectionTitre}>{t("section_dates")}</div>
              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("date_depart")}</label>
                  <input type="date" value={valeurs.date_depart} onChange={(e) => majChamp("date_depart", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("date_retour")}</label>
                  <input type="date" value={valeurs.date_retour} onChange={(e) => majChamp("date_retour", e.target.value)} required />
                </div>
              </div>

              <div className={styles.champ}>
                <label>{t("date_limite_paiement")}</label>
                <input type="date" value={valeurs.date_limite_paiement} onChange={(e) => majChamp("date_limite_paiement", e.target.value)} />
                <p className={styles.aideChamp}>{t("aide_date_limite_paiement")}</p>
              </div>

              <div className={styles.sectionTitre}>{t("section_tarifs")}</div>
              <div className={styles.champ}>
                <label>{t("prix_programme")}</label>
                <input type="number" step="0.01" value={valeurs.prix} onChange={(e) => majChamp("prix", e.target.value)} placeholder="Ex: 25000000" />
                <p className={styles.aideChamp}>{t("aide_prix_programme")}</p>
              </div>

              {erreur && <p className={styles.erreur}>{erreur}</p>}

              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>
                  {t("annuler")}
                </button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>
                  {envoi ? t("enregistrement") : t("enregistrer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListeProgrammes;