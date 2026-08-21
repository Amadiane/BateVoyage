import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, X, CalendarDays, Clock, Wallet, Archive } from "lucide-react";
import { programmeService } from "../../services/programmeService";
import styles from "../../theme/pages/programmes/ListeProgrammes.module.css";

const VALEURS_INITIALES = {
  nom: "", type_programme: "", annee: new Date().getFullYear(),
  date_depart: "", date_retour: "", date_limite_paiement: "", prix: "", est_archive: false,
};

function ListeProgrammes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [programmes, setProgrammes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreAnnee, setFiltreAnnee] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [programmeAModifier, setProgrammeAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    const params = {};
    if (filtreAnnee) params.annee = filtreAnnee;
    if (filtreType) params.type_programme = filtreType;
    programmeService.lister(params).then(({ data }) => {
      setProgrammes(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [filtreAnnee, filtreType]);

  const anneesDisponibles = [...new Set(programmes.map((p) => p.annee))].sort((a, b) => b - a);

  const ouvrirNouveau = () => {
    setProgrammeAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (p, e) => {
    e.stopPropagation();
    setProgrammeAModifier(p);
    setValeurs({
      nom: p.nom, type_programme: p.type_programme, annee: p.annee,
      date_depart: p.date_depart, date_retour: p.date_retour,
      date_limite_paiement: p.date_limite_paiement || "", prix: p.prix || "",
      est_archive: p.est_archive,
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
        if (donnees[k] === "" && k !== "est_archive") delete donnees[k];
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

  const supprimer = async (id, e) => {
    e.stopPropagation();
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
          <Plus size={16} /> {t("nouvelle_activite")}
        </button>
      </div>

      <div className={styles.barreOutils}>
        <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("toutes_annees")}</option>
          {anneesDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_types")}</option>
          <option value="hajj">{t("type_hajj")}</option>
          <option value="oumra_ramadan">{t("type_oumra_ramadan")}</option>
          <option value="oumra_classique">{t("type_oumra_classique")}</option>
        </select>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && programmes.length === 0 && <p className={styles.etatVide}>{t("aucun_programme")}</p>}
        {!chargement && programmes.map((p) => (
          <div key={p.id} className={styles.carteProgramme} onClick={() => navigate(`/programmes/${p.id}`)}>
            <div className={styles.bandeauCarte}>
              <span className={`${styles.badgeType} ${styles["type_" + p.type_programme]}`}>
                {t(`type_${p.type_programme}`)} {p.annee}
              </span>
              {p.est_archive ? (
                <span className={styles.badgeArchive}><Archive size={11} /> {t("archive")}</span>
              ) : (
                <span className={styles.badgeActif}>{t("actif")}</span>
              )}
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

            {!p.est_archive && p.date_limite_paiement && (
              <div className={styles.echeancePaiement}>
                <Clock size={13} />
                <span>{t("echeance_paiement")} : {p.date_limite_paiement}</span>
              </div>
            )}

            <div className={styles.piedCarte}>
              <span className={styles.nbPelerins}>{p.nb_pelerins} {t("pelerins")}</span>
              <div className={styles.actionsCarte}>
                <button onClick={(e) => ouvrirModification(p, e)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={(e) => supprimer(p.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{programmeAModifier ? t("modifier_programme") : t("nouvelle_activite")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_programme")}</label>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required placeholder="Hajj 2024" />
              </div>

              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("type_programme_label")}</label>
                  <select value={valeurs.type_programme} onChange={(e) => majChamp("type_programme", e.target.value)} required>
                    <option value="">—</option>
                    <option value="hajj">{t("type_hajj")}</option>
                    <option value="oumra_ramadan">{t("type_oumra_ramadan")}</option>
                    <option value="oumra_classique">{t("type_oumra_classique")}</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("annee")}</label>
                  <input type="number" value={valeurs.annee} onChange={(e) => majChamp("annee", e.target.value)} required />
                </div>
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
                <label className={styles.labelCheckbox}>
                  <input type="checkbox" checked={valeurs.est_archive} onChange={(e) => majChamp("est_archive", e.target.checked)} />
                  {t("marquer_archive")}
                </label>
                <p className={styles.aideChamp}>{t("aide_archive")}</p>
              </div>

              {!valeurs.est_archive && (
                <div className={styles.champ}>
                  <label>{t("date_limite_paiement")}</label>
                  <input type="date" value={valeurs.date_limite_paiement} onChange={(e) => majChamp("date_limite_paiement", e.target.value)} />
                </div>
              )}

              <div className={styles.sectionTitre}>{t("section_tarifs")}</div>
              <div className={styles.champ}>
                <label>{t("prix_programme")}</label>
                <input type="number" step="0.01" value={valeurs.prix} onChange={(e) => majChamp("prix", e.target.value)} />
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

export default ListeProgrammes;