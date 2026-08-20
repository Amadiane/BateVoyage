import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { paiementService } from "../../services/paiementService";
import { ouvrirFichierProtege, telechargerFichierProtege } from "../../utils/telechargement";
import ModalNouveauPaiement from "../../components/ModalNouveauPaiement/ModalNouveauPaiement";
import CONFIG from "../../config/config";
import styles from "../../theme/pages/paiements/ListePaiements.module.css";

function ListePaiements() {
  const { t } = useTranslation();
  const [paiements, setPaiements] = useState([]);
  const [resume, setResume] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreMode, setFiltreMode] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [paiementAModifier, setPaiementAModifier] = useState(null);
  const [modalOuverte, setModalOuverte] = useState(false);

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (recherche) params.search = recherche;
      if (filtreMode) params.mode_paiement = filtreMode;
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      const { data } = await paiementService.lister(params);
      setPaiements(data);
    } finally {
      setChargement(false);
    }
  };

  const chargerResume = () => {
    paiementService.obtenirResumeFinancier().then(({ data }) => setResume(data));
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [recherche, filtreMode, dateDebut, dateFin]);

  useEffect(() => {
    chargerResume();
  }, []);

  const supprimer = async (id, e) => {
    e.stopPropagation();
    const motif = window.prompt(t("motif_suppression_paiement"));
    if (motif === null) return;
    if (!motif.trim()) {
      alert(t("motif_obligatoire"));
      return;
    }
    await paiementService.supprimer(id);
    charger();
    chargerResume();
  };

  const onEnregistre = () => {
    charger();
    chargerResume();
  };

  const exporterCsv = () => {
    const params = new URLSearchParams();
    if (recherche) params.append("search", recherche);
    if (filtreMode) params.append("mode_paiement", filtreMode);
    if (dateDebut) params.append("date_debut", dateDebut);
    if (dateFin) params.append("date_fin", dateFin);
    telechargerFichierProtege(`${CONFIG.API_PAIEMENTS_EXPORT_CSV}?${params}`, "paiements_export.csv");
  };

  const total = paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0);

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_paiements")}</h1>
          <p className={styles.sousTitre}>{paiements.length} {t("versements_enregistres")}</p>
        </div>
        <div className={styles.groupeDroiteEntete}>
          <button className={styles.boutonExport} onClick={exporterCsv}>
            ⬇ {t("exporter_csv")}
          </button>
          <div className={styles.carteTotal}>
            <p className={styles.labelTotal}>{t("total_periode")}</p>
            <p className={styles.chiffreTotal}>{total.toLocaleString("fr-FR")} GNF</p>
          </div>
        </div>
      </div>

      {resume && (
        <div className={styles.cartesResume}>
          <div className={styles.carteResumeItem}>
            <p className={styles.chiffreResume}>{parseFloat(resume.total_general).toLocaleString("fr-FR")} GNF</p>
            <p className={styles.labelResume}>{t("total_general")}</p>
          </div>
          <div className={styles.carteResumeItem}>
            <p className={styles.chiffreResume}>{parseFloat(resume.total_mois_courant).toLocaleString("fr-FR")} GNF</p>
            <p className={styles.labelResume}>{t("total_ce_mois")}</p>
          </div>
          <div className={styles.carteResumeItem}>
            <p className={styles.chiffreResume}>{resume.nombre_paiements_mois}</p>
            <p className={styles.labelResume}>{t("versements_ce_mois")}</p>
          </div>
        </div>
      )}

      <div className={styles.barreOutils}>
        <input
          type="text"
          placeholder={t("rechercher_paiement")}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className={styles.champRecherche}
        />
        <select value={filtreMode} onChange={(e) => setFiltreMode(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_modes")}</option>
          <option value="especes">{t("mode_especes")}</option>
          <option value="orange_money">{t("mode_orange_money")}</option>
          <option value="virement">{t("mode_virement")}</option>
        </select>
        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={styles.champDate} />
        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={styles.champDate} />
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("numero_recu")}</th>
              <th>{t("date_paiement")}</th>
              <th>{t("pelerin")}</th>
              <th>{t("montant")}</th>
              <th>{t("mode_paiement")}</th>
              <th>{t("enregistre_par")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={7} className={styles.etatVide}>{t("chargement")}</td></tr>
            )}
            {!chargement && paiements.length === 0 && (
              <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_paiement")}</td></tr>
            )}
            {!chargement && paiements.map((p) => (
              <tr key={p.id}>
                <td className={styles.cellRecu}>{p.numero_recu}</td>
                <td>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</td>
                <td>
                  <span className={styles.cellId}>{p.pelerin_numero_id}</span> — {p.pelerin_nom}
                </td>
                <td className={styles.cellMontant}>{parseFloat(p.montant).toLocaleString("fr-FR")} GNF</td>
                <td>
                  <span className={`${styles.badge} ${styles["mode_" + p.mode_paiement]}`}>
                    {p.mode_paiement_display}
                  </span>
                </td>
                <td className={styles.cellAgent}>{p.enregistre_par_nom}</td>
                <td className={styles.cellActions}>
                  {p.scan_recu && (
                    <button onClick={() => ouvrirFichierProtege(paiementService.urlRecuScan(p.id))} title={t("voir_document")}>👁</button>
                  )}
                  <button onClick={() => telechargerFichierProtege(paiementService.urlRecuPdf(p.id), `recu_${p.numero_recu}.pdf`)} title={t("telecharger_recu")}>🧾</button>
                  <button onClick={() => { setPaiementAModifier(p); setModalOuverte(true); }} title={t("modifier")}>✎</button>
                  <button onClick={(e) => supprimer(p.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <ModalNouveauPaiement
          pelerinId={paiementAModifier?.pelerin}
          paiementExistant={paiementAModifier}
          onFermer={() => { setModalOuverte(false); setPaiementAModifier(null); }}
          onEnregistre={onEnregistre}
        />
      )}
    </div>
  );
}

export default ListePaiements;