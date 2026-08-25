import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, CheckCircle, History } from "lucide-react";
import { comptabiliteService } from "../../services/comptabiliteService";
import HistoriqueGenerique from "../../components/HistoriqueGenerique/HistoriqueGenerique";
import styles from "../../theme/pages/comptabilite/OngletsComptabilite.module.css";

const VALEURS_INITIALES = { beneficiaire_nom: "", montant: "", motif: "", date_sortie: new Date().toISOString().slice(0, 10) };

function OngletBonsSortie({ onChange }) {
  const { t } = useTranslation();
  const [bons, setBons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreJustifie, setFiltreJustifie] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [bonHistorique, setBonHistorique] = useState(null);

  const charger = () => {
    setChargement(true);
    const params = {};
    if (filtreJustifie !== "") params.justifie = filtreJustifie;
    comptabiliteService.listerBonsSortie(params).then(({ data }) => {
      setBons(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [filtreJustifie]);

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await comptabiliteService.creerBonSortie(valeurs);
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

  const marquerJustifie = async (bon) => {
    await comptabiliteService.modifierBonSortie(bon.id, {
      justifie: true,
      date_justification: new Date().toISOString().slice(0, 10),
    });
    charger();
    onChange();
  };

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression"))) return;
    await comptabiliteService.supprimerBonSortie(id);
    charger();
    onChange();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div className={styles.filtres}>
          <select value={filtreJustifie} onChange={(e) => setFiltreJustifie(e.target.value)} className={styles.selectFiltre}>
            <option value="">{t("tous")}</option>
            <option value="false">{t("non_justifie")}</option>
            <option value="true">{t("justifie")}</option>
          </select>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => setModalOuverte(true)}>
          <Plus size={16} /> {t("nouveau_bon_sortie")}
        </button>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("numero_bon")}</th>
              <th>{t("beneficiaire")}</th>
              <th>{t("montant")}</th>
              <th>{t("motif")}</th>
              <th>{t("date")}</th>
              <th>{t("statut")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={7} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && bons.length === 0 && <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && bons.map((b) => (
              <tr key={b.id}>
                <td className={styles.cellNumero}>{b.numero_bon}</td>
                <td>{b.beneficiaire_nom}</td>
                <td className={styles.cellMontant}>{parseFloat(b.montant).toLocaleString("fr-FR")} GNF</td>
                <td>{b.motif}</td>
                <td>{b.date_sortie}</td>
                <td>
                  <span className={b.justifie ? styles.badgeVert : styles.badgeRouge}>
                    {b.justifie ? t("justifie") : t("non_justifie")}
                  </span>
                </td>
                <td className={styles.cellActions}>
                  {!b.justifie && (
                    <button onClick={() => marquerJustifie(b)} title={t("marquer_justifie")}><CheckCircle size={14} /></button>
                  )}
                  <button onClick={() => setBonHistorique(b)} title={t("historique")}><History size={14} /></button>
                  <button onClick={() => supprimer(b.id)} title={t("supprimer")} className={styles.boutonSupprimer}>✕</button>
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
              <h2>{t("nouveau_bon_sortie")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("beneficiaire")}</label>
                <input value={valeurs.beneficiaire_nom} onChange={(e) => majChamp("beneficiaire_nom", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("montant")}</label>
                <input type="number" step="0.01" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("motif")}</label>
                <input value={valeurs.motif} onChange={(e) => majChamp("motif", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" value={valeurs.date_sortie} onChange={(e) => majChamp("date_sortie", e.target.value)} required />
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

      {bonHistorique && (
        <HistoriqueGenerique
          chargerDonnees={() => comptabiliteService.obtenirHistoriqueBonSortie(bonHistorique.id)}
          onFermer={() => setBonHistorique(null)}
        />
      )}
    </div>
  );
}

export default OngletBonsSortie;