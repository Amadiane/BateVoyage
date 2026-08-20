import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import { paiementService } from "../../services/paiementService";
import CONFIG from "../../config/config";
import { ouvrirFichierProtege, telechargerFichierProtege } from "../../utils/telechargement";
import HistoriquePelerin from "../../components/HistoriquePelerin/HistoriquePelerin";
import ModalNouveauPaiement from "../../components/ModalNouveauPaiement/ModalNouveauPaiement";
import BadgeStatutPaiement from "../../components/BadgeStatutPaiement/BadgeStatutPaiement";
import styles from "../../theme/pages/pelerins/DetailPelerin.module.css";

function DetailPelerin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pelerin, setPelerin] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [paiements, setPaiements] = useState([]);
  const [modalPaiementOuverte, setModalPaiementOuverte] = useState(false);
  const [paiementAModifier, setPaiementAModifier] = useState(null);

  const chargerPelerin = () => {
    pelerinService.obtenir(id).then(({ data }) => {
      setPelerin(data);
      setChargement(false);
    });
  };

  const chargerPaiements = () => {
    paiementService.lister({ pelerin: id }).then(({ data }) => setPaiements(data));
  };

  useEffect(() => {
    chargerPelerin();
    chargerPaiements();
  }, [id]);

  const onPaiementAjoute = () => {
    chargerPaiements();
    chargerPelerin();
  };

  const supprimerPaiement = async (paiementId) => {
    const motif = window.prompt(t("motif_suppression_paiement"));
    if (motif === null) return;
    if (!motif.trim()) {
      alert(t("motif_obligatoire"));
      return;
    }
    await paiementService.supprimer(paiementId);
    onPaiementAjoute();
  };

  const supprimer = async () => {
    const { data } = await pelerinService.verifierSuppression(id);
    const messageAvertissement = data.nb_paiements > 0
      ? t("avertissement_suppression_paiements", {
          nombre: data.nb_paiements,
          total: data.total_paiements.toLocaleString("fr-FR"),
        })
      : t("confirmer_suppression");

    if (!window.confirm(messageAvertissement)) return;
    await pelerinService.supprimer(id);
    navigate("/pelerins");
  };

  const telechargerFiche = () => {
    telechargerFichierProtege(pelerinService.urlFichePdf(id), `fiche_${pelerin.numero_id}.pdf`);
  };

  const voirDocument = (champ) => {
    ouvrirFichierProtege(CONFIG.API_PELERIN_DOCUMENT(id, champ));
  };

  const telechargerDocument = (champ, nomFichier) => {
    telechargerFichierProtege(CONFIG.API_PELERIN_DOCUMENT(id, champ), nomFichier);
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;
  if (!pelerin) return <p className={styles.chargement}>{t("aucun_pelerin")}</p>;

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate("/pelerins")}>
        ← {t("retour_liste")}
      </button>

      <div className={styles.entete}>
        <div className={styles.identiteEntete}>
          {pelerin.photo ? (
            <img src={pelerin.photo} alt="" className={styles.photo} />
          ) : (
            <div className={styles.photoPlaceholder}>{pelerin.prenom?.[0]}{pelerin.nom?.[0]}</div>
          )}
          <div>
            <p className={styles.numeroId}>{pelerin.numero_id}</p>
            <h1 className={styles.nomComplet}>{pelerin.prenom} {pelerin.nom}</h1>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles["badge_" + pelerin.statut]}`}>
                {t(`statut_${pelerin.statut}`)}
              </span>
              <span className={`${styles.badge} ${styles["badgeVisa_" + pelerin.statut_visa]}`}>
                {t(`visa_${pelerin.statut_visa}`)}
              </span>
              {pelerin.dossier_complet && (
                <span className={`${styles.badge} ${styles.badgeComplet}`}>{t("dossier_complet")}</span>
              )}
              <BadgeStatutPaiement statut={pelerin.statut_paiement} />
            </div>
          </div>
        </div>

        <div className={styles.actionsEntete}>
          <button onClick={() => setHistoriqueOuvert(true)} className={styles.boutonSecondaire}>
            🕓 {t("historique")}
          </button>
          <Link to={`/pelerins/${id}/modifier`} className={styles.boutonSecondaire}>
            {t("modifier")}
          </Link>
          <button onClick={telechargerFiche} className={styles.boutonPrincipal}>
            {t("telecharger_fiche")}
          </button>
          <button onClick={supprimer} className={styles.boutonDanger}>
            {t("supprimer")}
          </button>
        </div>
      </div>

      <div className={styles.grilleSections}>
        <Section titre={t("etape_identite")}>
          <Ligne label={t("sexe")} valeur={pelerin.sexe_display} />
          <Ligne label={t("date_naissance")} valeur={pelerin.date_naissance} />
          <Ligne label={t("lieu_naissance")} valeur={pelerin.lieu_naissance} />
          <Ligne label={t("type_voyage")} valeur={t(`type_${pelerin.type_voyage}`)} />
        </Section>

        <Section titre={t("etape_passeport")}>
          <Ligne label={t("numero_passeport")} valeur={pelerin.numero_passeport} />
          <Ligne label={t("date_emission_passeport")} valeur={pelerin.date_emission_passeport} />
          <Ligne label={t("date_expiration_passeport")} valeur={pelerin.date_expiration_passeport} />
          {pelerin.scan_passeport && (
            <div className={styles.actionsDocument}>
              <button className={styles.lienDocument} onClick={() => voirDocument("scan_passeport")}>
                👁 {t("voir_document")}
              </button>
              <button
                className={styles.lienDocument}
                onClick={() => telechargerDocument("scan_passeport", `passeport_${pelerin.numero_id}.pdf`)}
              >
                ⬇ {t("telecharger")}
              </button>
            </div>
          )}
        </Section>

        <Section titre={t("etape_adresse")}>
          <Ligne label={t("commune")} valeur={pelerin.commune} />
          <Ligne label={t("quartier")} valeur={pelerin.quartier} />
          <Ligne label={t("nom_pere")} valeur={pelerin.nom_pere || "—"} />
          <Ligne label={t("nom_mere")} valeur={pelerin.nom_mere || "—"} />
        </Section>

        <Section titre={t("etape_contact")}>
          <Ligne label={t("telephone")} valeur={pelerin.telephone} />
          <Ligne label={t("nom_correspondant")} valeur={pelerin.nom_correspondant} />
          <Ligne label={t("telephone_correspondant")} valeur={pelerin.telephone_correspondant} />
          <Ligne label={t("agence_partenaire")} valeur={pelerin.agence_partenaire || "—"} />
        </Section>

        <Section titre={t("etape_sante")}>
          <Ligne label={t("groupe_sanguin")} valeur={pelerin.groupe_sanguin || "—"} />
          <Ligne label={t("probleme_sante")} valeur={pelerin.probleme_sante || t("aucun_si_neant")} />
          {pelerin.scan_certificat_medical && (
            <div className={styles.actionsDocument}>
              <button className={styles.lienDocument} onClick={() => voirDocument("scan_certificat_medical")}>
                👁 {t("voir_document")}
              </button>
              <button
                className={styles.lienDocument}
                onClick={() => telechargerDocument("scan_certificat_medical", `certificat_medical_${pelerin.numero_id}.pdf`)}
              >
                ⬇ {t("telecharger")}
              </button>
            </div>
          )}
        </Section>

        <Section titre={t("etape_documents")}>
          <Ligne label={t("inscripteur")} valeur={pelerin.inscripteur_nom || "—"} />
          <Ligne label={t("programme")} valeur={pelerin.programme ? pelerin.programme : t("aucun_pour_le_moment")} />
        </Section>

        <Section titre={t("historique_paiements")}>
          <div className={styles.totalPaiements}>
            <span>{t("montant_total_verse")}</span>
            <strong>{parseFloat(pelerin.montant_total_verse || 0).toLocaleString("fr-FR")} GNF</strong>
          </div>

          {pelerin.reste_a_payer !== null && pelerin.reste_a_payer !== undefined && (
            <div className={styles.resteAPayer}>
              <span>{t("reste_a_payer_estime")}</span>
              <strong className={pelerin.reste_a_payer > 0 ? styles.resteRouge : styles.resteVert}>
                {pelerin.reste_a_payer.toLocaleString("fr-FR")} GNF
              </strong>
            </div>
          )}

          {pelerin.jours_avant_depart !== null && pelerin.jours_avant_depart !== undefined && (
            <p className={styles.infoDepart}>
              {pelerin.jours_avant_depart >= 0
                ? t("jours_restants_avant_depart", { jours: pelerin.jours_avant_depart })
                : t("depart_deja_passe")}
            </p>
          )}

          {paiements.length === 0 ? (
            <p className={styles.etatVideMini}>{t("aucun_paiement")}</p>
          ) : (
            paiements.map((p) => (
              <div key={p.id} className={styles.lignePaiementDetail}>
                <div className={styles.infoPaiement}>
                  <span className={styles.labelLigne}>
                    {p.numero_recu} — {new Date(p.date_paiement).toLocaleDateString("fr-FR")}
                  </span>
                  <span className={styles.valeurLigne}>
                    {parseFloat(p.montant).toLocaleString("fr-FR")} GNF — {p.mode_paiement_display}
                  </span>
                </div>
                <div className={styles.actionsPaiement}>
                  {p.scan_recu && (
                    <button
                      className={styles.miniBouton}
                      onClick={() => ouvrirFichierProtege(paiementService.urlRecuScan(p.id))}
                      title={t("voir_document")}
                    >
                      👁
                    </button>
                  )}
                  <button
                    className={styles.miniBouton}
                    onClick={() => telechargerFichierProtege(paiementService.urlRecuPdf(p.id), `recu_${p.numero_recu}.pdf`)}
                    title={t("telecharger_recu")}
                  >
                    🧾
                  </button>
                  <button
                    className={styles.miniBouton}
                    onClick={() => { setPaiementAModifier(p); setModalPaiementOuverte(true); }}
                    title={t("modifier")}
                  >
                    ✎
                  </button>
                  <button
                    className={styles.miniBoutonDanger}
                    onClick={() => supprimerPaiement(p.id)}
                    title={t("supprimer")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => { setPaiementAModifier(null); setModalPaiementOuverte(true); }}
            className={styles.lienDocument}
            style={{ marginTop: 8 }}
          >
            + {t("ajouter_paiement")}
          </button>
        </Section>
      </div>

      {historiqueOuvert && (
        <HistoriquePelerin pelerinId={id} onFermer={() => setHistoriqueOuvert(false)} />
      )}

      {modalPaiementOuverte && (
        <ModalNouveauPaiement
          pelerinId={id}
          paiementExistant={paiementAModifier}
          onFermer={() => { setModalPaiementOuverte(false); setPaiementAModifier(null); }}
          onEnregistre={onPaiementAjoute}
        />
      )}
    </div>
  );
}

function Section({ titre, children }) {
  return (
    <div className={styles.carteSection}>
      <h2 className={styles.titreSection}>{titre}</h2>
      <div className={styles.contenuSection}>{children}</div>
    </div>
  );
}

function Ligne({ label, valeur }) {
  return (
    <div className={styles.ligne}>
      <span className={styles.labelLigne}>{label}</span>
      <span className={styles.valeurLigne}>{valeur}</span>
    </div>
  );
}

export default DetailPelerin;