import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, CheckCircle, History } from "lucide-react";
import { comptabiliteService } from "../../services/comptabiliteService";
import HistoriqueGenerique from "../../components/HistoriqueGenerique/HistoriqueGenerique";
import styles from "../../theme/pages/comptabilite/OngletsComptabilite.module.css";

const VALEURS_INITIALES = { nom_fournisseur: "", montant_du: "", motif: "", date_echeance: "" };

function OngletDettesFournisseurs({ onChange }) {
  const { t } = useTranslation();
  const [dettes, setDettes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreSoldee, setFiltreSoldee] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [detteSelectionnee, setDetteSelectionnee] = useState(null);
  const [detteHistorique, setDetteHistorique] = useState(null);

  const charger = () => {
    setChargement(true);
    const params = {};
    if (filtreSoldee !== "") params.soldee = filtreSoldee;
    comptabiliteService.listerDettesFournisseurs(params).then(({ data }) => {
      setDettes(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [filtreSoldee]);

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = { ...valeurs };
      if (!donnees.date_echeance) delete donnees.date_echeance;
      await comptabiliteService.creerDetteFournisseur(donnees);
      setModalOuverte(false);
      setValeurs(VALEURS_INITIALES);
      charger();
      onChange();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const marquerSoldee = async (dette) => {
    await comptabiliteService.modifierDetteFournisseur(dette.id, {
      soldee: true,
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    charger();
    onChange();
  };

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression"))) return;
    await comptabiliteService.supprimerDetteFournisseur(id);
    charger();
    onChange();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div className={styles.filtres}>
          <select value={filtreSoldee} onChange={(e) => setFiltreSoldee(e.target.value)} className={styles.selectFiltre}>
            <option value="">{t("tous")}</option>
            <option value="false">{t("non_soldee")}</option>
            <option value="true">{t("soldee")}</option>
          </select>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
          <Plus size={16} /> {t("nouvelle_dette")}
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("fournisseur")}</th>
              <th>{t("montant")}</th>
              <th>{t("motif")}</th>
              <th>{t("date_echeance")}</th>
              <th>{t("statut")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={6} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && dettes.length === 0 && <tr><td colSpan={6} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && dettes.map((d) => (
              <tr key={d.id} className={styles.ligneCliquable} onClick={() => setDetteSelectionnee(d)}>
                <td>{d.nom_fournisseur}</td>
                <td className={styles.cellMontant}>{parseFloat(d.montant_du).toLocaleString("fr-FR")} GNF</td>
                <td>{d.motif}</td>
                <td>{d.date_echeance || "—"}</td>
                <td>
                  <span className={d.soldee ? styles.badgeVert : styles.badgeRouge}>
                    {d.soldee ? t("soldee") : t("non_soldee")}
                  </span>
                </td>
                <td className={styles.cellActions} onClick={(e) => e.stopPropagation()}>
                  {!d.soldee && (
                    <button onClick={() => marquerSoldee(d)} title={t("marquer_soldee")}><CheckCircle size={14} /></button>
                  )}
                  <button onClick={() => setDetteHistorique(d)} title={t("historique")}><History size={14} /></button>
                  <button onClick={() => supprimer(d.id)} title={t("supprimer")} className={styles.boutonSupprimer}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("nouvelle_dette")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("fournisseur")}</label>
                <input value={valeurs.nom_fournisseur} onChange={(e) => majChamp("nom_fournisseur", e.target.value)} required placeholder="Makkah Towers" />
              </div>
              <div className={styles.champ}>
                <label>{t("montant")}</label>
                <input type="number" step="0.01" value={valeurs.montant_du} onChange={(e) => majChamp("montant_du", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("motif")}</label>
                <input value={valeurs.motif} onChange={(e) => majChamp("motif", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("date_echeance")}</label>
                <input type="date" value={valeurs.date_echeance} onChange={(e) => majChamp("date_echeance", e.target.value)} />
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

      {detteSelectionnee && (
        <div className={styles.superposition} onClick={() => setDetteSelectionnee(null)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("details_dette")}</h2>
              <button className={styles.boutonFermer} onClick={() => setDetteSelectionnee(null)}><X size={16} /></button>
            </div>
            <div className={styles.detailsDette}>
              <p><strong>{t("fournisseur")} :</strong> {detteSelectionnee.nom_fournisseur}</p>
              <p><strong>{t("montant")} :</strong> {parseFloat(detteSelectionnee.montant_du).toLocaleString("fr-FR")} GNF</p>
              <p><strong>{t("motif")} :</strong> {detteSelectionnee.motif}</p>
              <p><strong>{t("date_echeance")} :</strong> {detteSelectionnee.date_echeance || "—"}</p>
              <p><strong>{t("statut")} :</strong> {detteSelectionnee.soldee ? t("soldee") : t("non_soldee")}</p>
              {detteSelectionnee.date_paiement && <p><strong>{t("date_paiement")} :</strong> {detteSelectionnee.date_paiement}</p>}
              <p><strong>{t("enregistre_par")} :</strong> {detteSelectionnee.enregistre_par_nom}</p>
            </div>
          </div>
        </div>
      )}

      {detteHistorique && (
        <HistoriqueGenerique
          chargerDonnees={() => comptabiliteService.obtenirHistoriqueDetteFournisseur(detteHistorique.id)}
          onFermer={() => setDetteHistorique(null)}
        />
      )}
    </div>
  );
}

export default OngletDettesFournisseurs;