import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, FileText, LayoutGrid, List, AlertTriangle, ChevronDown } from "lucide-react";
import { pelerinService } from "../../services/pelerinService";
import { ouvrirFichierProtege, telechargerFichierProtege } from "../../utils/telechargement";
import CONFIG from "../../config/config";
import styles from "../../theme/pages/moduleVoyage/PageVisaDocModule.module.css";

const COULEURS_STATUT = {
  non_demande: "gris",
  en_cours: "bleu",
  obtenu: "vert",
  refuse: "rouge",
  expire: "orange",
};

const ORDRE_COLONNES = ["non_demande", "en_cours", "obtenu", "refuse", "expire"];

function PageVisaDocModule({ typeVoyage, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [vue, setVue] = useState("kanban");
  const [colonneOuverte, setColonneOuverte] = useState(null);

  const charger = () => {
    setChargement(true);
    pelerinService.lister({ type_voyage: typeVoyage }).then(({ data }) => {
      setPelerins(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [typeVoyage]);

  const alerteExpiration = (jours) => {
    if (jours === null || jours === undefined) return null;
    if (jours < 0) return { texte: t("passeport_expire"), classe: styles.alerteRouge };
    if (jours <= 180) return { texte: t("expire_dans_x_jours", { jours }), classe: styles.alerteOrange };
    return null;
  };

  const compteParStatut = ORDRE_COLONNES.reduce((acc, s) => {
    acc[s] = pelerins.filter((p) => p.statut_visa === s).length;
    return acc;
  }, {});

  const pelerinsAffiches = filtreStatut ? pelerins.filter((p) => p.statut_visa === filtreStatut) : pelerins;

  const CarteMini = ({ p }) => {
    const alerte = alerteExpiration(p.jours_avant_expiration_passeport);
    return (
      <div className={styles.cartePelerin} onClick={() => navigate(`/pelerins/${p.id}`)}>
        <div className={styles.enteteCartePelerin}>
          <span className={styles.cellId}>{p.numero_id}</span>
          {p.biometrie_effectuee && <span className={styles.pucePetiteVerte} title={t("biometrie_faite")} />}
        </div>
        <p className={styles.nomCartePelerin}>{p.prenom} {p.nom}</p>
        <p className={styles.passeportCartePelerin}>{p.numero_passeport}</p>
        {alerte && (
          <div className={alerte.classe}>
            <AlertTriangle size={11} /> {alerte.texte}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_visa_doc")}</h1>
        <div className={styles.basculeVue}>
          <button className={vue === "kanban" ? styles.boutonVueActif : styles.boutonVue} onClick={() => setVue("kanban")}>
            <LayoutGrid size={15} /> {t("vue_kanban")}
          </button>
          <button className={vue === "tableau" ? styles.boutonVueActif : styles.boutonVue} onClick={() => setVue("tableau")}>
            <List size={15} /> {t("vue_tableau")}
          </button>
        </div>
      </div>

      <div className={styles.cartesResume}>
        {ORDRE_COLONNES.map((s) => (
          <button
            key={s}
            className={`${styles.carteResume} ${styles["carteResume_" + COULEURS_STATUT[s]]} ${filtreStatut === s ? styles.carteResumeActive : ""}`}
            onClick={() => setFiltreStatut(filtreStatut === s ? "" : s)}
          >
            <span className={styles.chiffreResume}>{compteParStatut[s]}</span>
            <span className={styles.labelResume}>{t(`visa_${s}`)}</span>
          </button>
        ))}
      </div>

      {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}

      {!chargement && vue === "kanban" && (
        <div className={styles.grilleKanban}>
          {ORDRE_COLONNES.map((s) => {
            if (filtreStatut && filtreStatut !== s) return null;
            const pelerinsColonne = pelerins.filter((p) => p.statut_visa === s);
            const estOuverte = colonneOuverte === s;
            return (
              <div key={s} className={styles.colonneKanban}>
                <button
                  className={`${styles.enteteColonne} ${styles["enteteColonne_" + COULEURS_STATUT[s]]}`}
                  onClick={() => setColonneOuverte(estOuverte ? null : s)}
                >
                  <span>{t(`visa_${s}`)}</span>
                  <span className={styles.compteurColonne}>{pelerinsColonne.length}</span>
                  <ChevronDown size={15} className={`${styles.chevronColonne} ${estOuverte ? styles.chevronOuvert : ""}`} />
                </button>
                {estOuverte && (
                  <div className={styles.contenuColonne}>
                    {pelerinsColonne.length === 0 && <p className={styles.etatVideColonne}>{t("aucun_resultat")}</p>}
                    {pelerinsColonne.map((p) => <CarteMini key={p.id} p={p} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!chargement && vue === "tableau" && (
        <div className={styles.conteneurTableau}>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("nom_complet")}</th>
                <th>{t("numero_passeport")}</th>
                <th>{t("date_expiration_passeport")}</th>
                <th>{t("statut_visa_label")}</th>
                <th>{t("biometrie")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pelerinsAffiches.length === 0 && <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_pelerin")}</td></tr>}
              {pelerinsAffiches.map((p) => {
                const alerte = alerteExpiration(p.jours_avant_expiration_passeport);
                return (
                  <tr key={p.id}>
                    <td className={styles.cellId}>{p.numero_id}</td>
                    <td onClick={() => navigate(`/pelerins/${p.id}`)} style={{ cursor: "pointer" }}>{p.prenom} {p.nom}</td>
                    <td>{p.numero_passeport}</td>
                    <td>
                      {p.date_expiration_passeport}
                      {alerte && <div className={alerte.classe}>{alerte.texte}</div>}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles["badge_" + COULEURS_STATUT[p.statut_visa]]}`}>
                        {p.statut_visa_display}
                      </span>
                    </td>
                    <td>
                      <span className={p.biometrie_effectuee ? styles.badgeVert : styles.badgeGris}>
                        {p.biometrie_effectuee ? t("effectuee") : t("non_effectuee")}
                      </span>
                    </td>
                    <td className={styles.cellActions}>
                      {p.scan_visa && (
                        <button onClick={() => ouvrirFichierProtege(CONFIG.API_PELERIN_DOCUMENT(p.id, "scan_visa"))} title={t("voir_document")}>
                          <Eye size={13} />
                        </button>
                      )}
                      <button onClick={() => telechargerFichierProtege(CONFIG.API_PELERIN_FICHE_VISA(p.id), `visa_${p.numero_id}.pdf`)} title={t("imprimer_fiche_visa")}>
                        <FileText size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PageVisaDocModule;