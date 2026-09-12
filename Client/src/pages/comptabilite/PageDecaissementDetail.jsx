import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Settings, ChevronDown, History } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import HistoriqueGenerique from "../../components/HistoriqueGenerique/HistoriqueGenerique";
import styles from "../../theme/pages/comptabilite/PageDecaissementDetail.module.css";

const VALEURS_INITIALES = {
  categorie: "", libelle_complementaire: "", montant: "", devise: "GNF",
  date_decaissement: new Date().toISOString().slice(0, 10), notes: "",
};

const VALEURS_SAISON_INITIALES = { nom: "", date_debut: "", date_fin: "" };

function PageDecaissementDetail({ activite, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [decaissements, setDecaissements] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [saisonSelectionnee, setSaisonSelectionnee] = useState(null);
  const [recap, setRecap] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);

  const [modalOuverte, setModalOuverte] = useState(false);
  const [decaissementAModifier, setDecaissementAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);
  const [decaissementHistorique, setDecaissementHistorique] = useState(null);

  const [modalTauxOuverte, setModalTauxOuverte] = useState(false);
  const [tauxTemp, setTauxTemp] = useState({ taux_usd: "", taux_sar: "" });

  const [modalSaisonOuverte, setModalSaisonOuverte] = useState(false);
  const [valeursSaison, setValeursSaison] = useState(VALEURS_SAISON_INITIALES);
  const [envoiSaison, setEnvoiSaison] = useState(false);

  const [ajoutCategorieOuvert, setAjoutCategorieOuvert] = useState(false);
  const [nouvelleCategorieNom, setNouvelleCategorieNom] = useState("");

  // Charge les données liées uniquement à la saison actuellement sélectionnée.
  // Séparée du chargement initial pour pouvoir être rappelée seule à chaque
  // changement de saison, sans redemander catégories/liste des saisons.
  const chargerDonneesSaison = async (idSaison) => {
    if (!idSaison) {
      setDecaissements([]);
      setRecap(null);
      return;
    }
    const [decRes, recapRes] = await Promise.all([
      decaissementService.lister({ activite, saison: idSaison }),
      decaissementService.obtenirRecapitulatif(activite, null, idSaison),
    ]);
    setDecaissements(decRes.data);
    setRecap(recapRes.data);
  };

  const chargerInitial = async () => {
    const [catRes, saisonsRes] = await Promise.all([
      decaissementService.listerCategories(activite),
      decaissementService.listerSaisons(activite),
    ]);
    setCategories(catRes.data);
    setSaisons(saisonsRes.data);

    const saisonParDefaut = (saisonsRes.data.find((s) => s.est_active) || saisonsRes.data[0])?.id || null;
    setSaisonSelectionnee(saisonParDefaut);
    await chargerDonneesSaison(saisonParDefaut);
  };

  useEffect(() => {
    setChargementInitial(true);
    chargerInitial().finally(() => setChargementInitial(false));
  }, [activite]);

  // Se déclenche à chaque changement explicite de saison (sélecteur, ou
  // juste après la création d'une nouvelle saison) — recharge TOUJOURS les
  // données propres à cette saison, jamais les anciennes valeurs affichées.
  const changerSaison = async (idSaison) => {
    setSaisonSelectionnee(idSaison);
    await chargerDonneesSaison(idSaison);
  };

  const ouvrirNouveau = () => {
    setDecaissementAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (d) => {
    setDecaissementAModifier(d);
    setValeurs({
      categorie: d.categorie, libelle_complementaire: d.libelle_complementaire || "",
      montant: d.montant, devise: d.devise,
      date_decaissement: d.date_decaissement, notes: d.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const ajouterCategorieLibre = async () => {
    if (!nouvelleCategorieNom.trim()) return;
    const { data } = await decaissementService.creerCategorie({ activite, nom: nouvelleCategorieNom });
    setCategories((c) => [...c, data]);
    majChamp("categorie", data.id);
    setNouvelleCategorieNom("");
    setAjoutCategorieOuvert(false);
  };

  const handleSubmit = async () => {
    setErreur("");
    if (!valeurs.categorie || !valeurs.montant || !valeurs.date_decaissement) {
      setErreur(t("champs_obligatoires_manquants"));
      return;
    }
    setEnvoi(true);
    try {
      const donnees = { ...valeurs, activite, saison: saisonSelectionnee };
      if (decaissementAModifier) {
        await decaissementService.modifier(decaissementAModifier.id, donnees);
      } else {
        await decaissementService.creer(donnees);
      }
      setModalOuverte(false);
      await chargerDonneesSaison(saisonSelectionnee);
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimer(aSupprimer.id);
    setASupprimer(null);
    await chargerDonneesSaison(saisonSelectionnee);
  };

  const ouvrirModalTaux = () => {
    setTauxTemp({ taux_usd: recap?.taux.taux_usd || "", taux_sar: recap?.taux.taux_sar || "" });
    setModalTauxOuverte(true);
  };

  const enregistrerTaux = async () => {
    await decaissementService.modifierTauxChange(tauxTemp);
    setModalTauxOuverte(false);
    await chargerDonneesSaison(saisonSelectionnee);
  };

  const ouvrirNouvelleSaison = () => {
    setValeursSaison(VALEURS_SAISON_INITIALES);
    setModalSaisonOuverte(true);
  };

  const creerSaison = async () => {
    if (!valeursSaison.nom || !valeursSaison.date_debut || !valeursSaison.date_fin) return;
    setEnvoiSaison(true);
    try {
      const { data } = await decaissementService.creerSaison({ ...valeursSaison, activite });
      setSaisons((s) => [data, ...s]);
      setModalSaisonOuverte(false);
      // Bascule explicitement sur la nouvelle saison ET recharge ses données
      // (forcément vides), pour ne jamais laisser les anciens totaux affichés.
      await changerSaison(data.id);
    } finally {
      setEnvoiSaison(false);
    }
  };

  if (chargementInitial) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/finances`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("decaissements")}</h1>
        <div className={styles.groupeBoutons}>
          <select
            value={saisonSelectionnee || ""}
            onChange={(e) => changerSaison(e.target.value ? Number(e.target.value) : null)}
            className={styles.selectAnnee}
          >
            {saisons.length === 0 && <option value="">{t("aucune_saison")}</option>}
            {saisons.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <button className={styles.boutonTaux} onClick={ouvrirNouvelleSaison}>
            <Plus size={14} /> {t("nouvelle_saison")}
          </button>
          <button className={styles.boutonTaux} onClick={ouvrirModalTaux}>
            <Settings size={14} /> {t("modifier_taux")}
          </button>
          <button className={styles.boutonPrincipal} onClick={ouvrirNouveau} disabled={!saisonSelectionnee}>
            <Plus size={16} /> {t("nouveau_decaissement")}
          </button>
        </div>
      </div>

      {recap && (
        <>
          <p className={styles.tauxActuel}>
            {t("taux_actuels")} : 1 USD = {parseFloat(recap.taux.taux_usd).toLocaleString("fr-FR")} GNF — 1 SAR = {parseFloat(recap.taux.taux_sar).toLocaleString("fr-FR")} GNF
          </p>
          <div className={styles.conteneurRecap}>
            <table className={styles.tableauRecap}>
              <thead>
                <tr>
                  <th>{t("frais_generaux")}</th>
                  <th>GNF</th>
                  <th>USD</th>
                  <th>SAR</th>
                </tr>
              </thead>
              <tbody>
                {recap.categories.map((c) => (
                  <tr key={c.categorie_id}>
                    <td className={styles.cellCategorie}>{c.categorie_nom}</td>
                    <td className={styles.cellMontant}>{c.total_gnf.toLocaleString("fr-FR")}</td>
                    <td className={styles.cellMontant}>{c.total_usd.toLocaleString("fr-FR")}</td>
                    <td className={styles.cellMontant}>{c.total_sar.toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
                <tr className={styles.ligneTotalRecap}>
                  <td>{t("total")}</td>
                  <td>{recap.categories.reduce((s, c) => s + c.total_gnf, 0).toLocaleString("fr-FR")}</td>
                  <td>{recap.categories.reduce((s, c) => s + c.total_usd, 0).toLocaleString("fr-FR")}</td>
                  <td>{recap.categories.reduce((s, c) => s + c.total_sar, 0).toLocaleString("fr-FR")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <button className={styles.enteteHistoriqueRepliable} onClick={() => setHistoriqueOuvert((v) => !v)}>
        <span>{t("historique_decaissements")} ({decaissements.length})</span>
        <ChevronDown size={16} className={`${styles.chevron} ${historiqueOuvert ? styles.chevronOuvert : ""}`} />
      </button>

      {historiqueOuvert && (
        <div className={styles.conteneurTableau}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("categorie")}</th>
                <th>{t("montant")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {decaissements.length === 0 && <tr><td colSpan={4} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
              {decaissements.map((d) => (
                <tr key={d.id}>
                  <td>{d.date_decaissement}</td>
                  <td>
                    {d.categorie_nom}
                    {d.libelle_complementaire && <span className={styles.libelleComplementaire}> — {d.libelle_complementaire}</span>}
                  </td>
                  <td className={styles.cellMontantListe}>{parseFloat(d.montant).toLocaleString("fr-FR")} {d.devise}</td>
                  <td className={styles.cellActions}>
                    <button onClick={() => setDecaissementHistorique(d)} title={t("historique")}><History size={13} /></button>
                    <button onClick={() => ouvrirModification(d)} title={t("modifier")}><Pencil size={13} /></button>
                    <button onClick={() => setASupprimer(d)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{decaissementAModifier ? t("modifier_decaissement") : t("nouveau_decaissement")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("categorie")}</label>
                <select value={valeurs.categorie} onChange={(e) => majChamp("categorie", e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {!ajoutCategorieOuvert ? (
                  <button type="button" className={styles.lienAjoutCategorie} onClick={() => setAjoutCategorieOuvert(true)}>
                    + {t("ajouter_autre_charge")}
                  </button>
                ) : (
                  <div className={styles.ligneAjoutCategorie}>
                    <input value={nouvelleCategorieNom} onChange={(e) => setNouvelleCategorieNom(e.target.value)} placeholder={t("nom_nouvelle_charge")} autoFocus />
                    <button type="button" onClick={ajouterCategorieLibre}>{t("ajouter")}</button>
                  </div>
                )}
              </div>
              <div className={styles.champ}>
                <label>{t("precision_libelle")}</label>
                <input value={valeurs.libelle_complementaire} onChange={(e) => majChamp("libelle_complementaire", e.target.value)} placeholder={t("ex_periode_concernee")} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("montant")}</label>
                  <input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("devise")}</label>
                  <select value={valeurs.devise} onChange={(e) => majChamp("devise", e.target.value)}>
                    <option value="GNF">GNF</option>
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" min="2020-01-01" max="2035-12-31" value={valeurs.date_decaissement} onChange={(e) => majChamp("date_decaissement", e.target.value)} />
              </div>
              <div className={styles.champ}>
                <label>{t("notes")}</label>
                <textarea rows={2} value={valeurs.notes} onChange={(e) => majChamp("notes", e.target.value)} />
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="button" className={styles.boutonPrincipal} onClick={handleSubmit} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalTauxOuverte && (
        <div className={styles.superposition} onClick={() => setModalTauxOuverte(false)}>
          <div className={styles.panneauEtroit} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("modifier_taux")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalTauxOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("taux_usd")} (GNF)</label>
                <input type="number" value={tauxTemp.taux_usd} onChange={(e) => setTauxTemp({ ...tauxTemp, taux_usd: e.target.value })} />
              </div>
              <div className={styles.champ}>
                <label>{t("taux_sar")} (GNF)</label>
                <input type="number" value={tauxTemp.taux_sar} onChange={(e) => setTauxTemp({ ...tauxTemp, taux_sar: e.target.value })} />
              </div>
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalTauxOuverte(false)}>{t("annuler")}</button>
                <button type="button" className={styles.boutonPrincipal} onClick={enregistrerTaux}>{t("enregistrer")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalSaisonOuverte && (
        <div className={styles.superposition} onClick={() => setModalSaisonOuverte(false)}>
          <div className={styles.panneauEtroit} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("nouvelle_saison")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalSaisonOuverte(false)}><X size={16} /></button>
            </div>
            <div className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_saison")}</label>
                <input value={valeursSaison.nom} onChange={(e) => setValeursSaison({ ...valeursSaison, nom: e.target.value })} placeholder="Hajj 2027" />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("date_debut")}</label>
                  <input type="date" value={valeursSaison.date_debut} onChange={(e) => setValeursSaison({ ...valeursSaison, date_debut: e.target.value })} />
                </div>
                <div className={styles.champ}>
                  <label>{t("date_fin")}</label>
                  <input type="date" value={valeursSaison.date_fin} onChange={(e) => setValeursSaison({ ...valeursSaison, date_fin: e.target.value })} />
                </div>
              </div>
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalSaisonOuverte(false)}>{t("annuler")}</button>
                <button type="button" className={styles.boutonPrincipal} onClick={creerSaison} disabled={envoiSaison}>{envoiSaison ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <ModalConfirmation
          titre={t("confirmer_suppression_titre")}
          message={t("confirmer_suppression_message")}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}

      {decaissementHistorique && (
        <HistoriqueGenerique
          chargerDonnees={() => decaissementService.obtenirHistoriqueDecaissement(decaissementHistorique.id)}
          onFermer={() => setDecaissementHistorique(null)}
        />
      )}
    </div>
  );
}

export default PageDecaissementDetail;  