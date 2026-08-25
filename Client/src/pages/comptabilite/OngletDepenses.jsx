import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, History } from "lucide-react";
import { comptabiliteService } from "../../services/comptabiliteService";
import HistoriqueGenerique from "../../components/HistoriqueGenerique/HistoriqueGenerique";
import styles from "../../theme/pages/comptabilite/OngletsComptabilite.module.css";

const VALEURS_INITIALES = { categorie: "", montant: "", description: "", date_depense: new Date().toISOString().slice(0, 10) };

function OngletDepenses({ onChange }) {
  const { t } = useTranslation();
  const [depenses, setDepenses] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [depenseHistorique, setDepenseHistorique] = useState(null);

  const charger = () => {
    setChargement(true);
    comptabiliteService.listerDepenses().then(({ data }) => {
      setDepenses(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, []);

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await comptabiliteService.creerDepense(valeurs);
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

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression"))) return;
    await comptabiliteService.supprimerDepense(id);
    charger();
    onChange();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div />
        <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
          <Plus size={16} /> {t("nouvelle_depense")}
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("categorie")}</th>
              <th>{t("description")}</th>
              <th>{t("montant")}</th>
              <th>{t("date")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={5} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && depenses.length === 0 && <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && depenses.map((d) => (
              <tr key={d.id}>
                <td><span className={styles.badgeCategorie}>{d.categorie_display}</span></td>
                <td>{d.description}</td>
                <td className={styles.cellMontant}>{parseFloat(d.montant).toLocaleString("fr-FR")} GNF</td>
                <td>{d.date_depense}</td>
                <td className={styles.cellActions}>
                  <button onClick={() => setDepenseHistorique(d)} title={t("historique")}><History size={14} /></button>
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
              <h2>{t("nouvelle_depense")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("categorie")}</label>
                <select value={valeurs.categorie} onChange={(e) => majChamp("categorie", e.target.value)} required>
                  <option value="">—</option>
                  <option value="loyer">{t("categorie_loyer")}</option>
                  <option value="salaires">{t("categorie_salaires")}</option>
                  <option value="fournitures">{t("categorie_fournitures")}</option>
                  <option value="transport">{t("categorie_transport")}</option>
                  <option value="communication">{t("categorie_communication")}</option>
                  <option value="autre">{t("categorie_autre")}</option>
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("description")}</label>
                <input value={valeurs.description} onChange={(e) => majChamp("description", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("montant")}</label>
                <input type="number" step="0.01" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" value={valeurs.date_depense} onChange={(e) => majChamp("date_depense", e.target.value)} required />
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

      {depenseHistorique && (
        <HistoriqueGenerique
          chargerDonnees={() => comptabiliteService.obtenirHistoriqueDepense(depenseHistorique.id)}
          onFermer={() => setDepenseHistorique(null)}
        />
      )}
    </div>
  );
}

export default OngletDepenses;