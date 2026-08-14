import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import styles from "../../theme/pages/pelerins/DetailPelerin.module.css";

function DetailPelerin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pelerin, setPelerin] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    pelerinService.obtenir(id).then(({ data }) => {
      setPelerin(data);
      setChargement(false);
    });
  }, [id]);

  const supprimer = async () => {
    if (!window.confirm(t("confirmer_suppression"))) return;
    await pelerinService.supprimer(id);
    navigate("/pelerins");
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
            </div>
          </div>
        </div>

        <div className={styles.actionsEntete}>
          <Link to={`/pelerins/${id}/modifier`} className={styles.boutonSecondaire}>
            {t("modifier")}
          </Link>
          <a href={pelerinService.urlFichePdf(id)} target="_blank" rel="noreferrer" className={styles.boutonPrincipal}>
            {t("telecharger_fiche")}
          </a>
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
            <a href={pelerin.scan_passeport} target="_blank" rel="noreferrer" className={styles.lienDocument}>
              📄 {t("voir_document")}
            </a>
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
            <a href={pelerin.scan_certificat_medical} target="_blank" rel="noreferrer" className={styles.lienDocument}>
              📄 {t("voir_document")}
            </a>
          )}
        </Section>

        <Section titre={t("etape_documents")}>
          <Ligne label={t("inscripteur")} valeur={pelerin.inscripteur_nom || "—"} />
          <Ligne label={t("programme")} valeur={pelerin.programme ? pelerin.programme : t("aucun_pour_le_moment")} />
          <Ligne label={t("montant_verse")} valeur={`${pelerin.montant_verse || 0} GNF`} />
          {pelerin.scan_recu_versement && (
            <a href={pelerin.scan_recu_versement} target="_blank" rel="noreferrer" className={styles.lienDocument}>
              📄 {t("voir_document")}
            </a>
          )}
        </Section>
      </div>
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