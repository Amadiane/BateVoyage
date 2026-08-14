import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import { utilisateurService } from "../../services/utilisateurService";
import { programmeService } from "../../services/programmeService";
import styles from "../../theme/pages/pelerins/FormulairePelerin.module.css";

const ETAPES = ["identite", "passeport", "adresse", "contact", "sante", "documents"];

const VALEURS_INITIALES = {
  prenom: "", nom: "", sexe: "", date_naissance: "", lieu_naissance: "",
  numero_passeport: "", date_emission_passeport: "", date_expiration_passeport: "", statut_visa: "non_demande",
  commune: "", quartier: "", nom_pere: "", nom_mere: "",
  telephone: "", nom_correspondant: "", telephone_correspondant: "", agence_partenaire: "",
  groupe_sanguin: "", probleme_sante: "",
  type_voyage: "", montant_verse: "", inscripteur: "", programme: "",
};

function FormulairePelerin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const modeEdition = Boolean(id);

  const [etape, setEtape] = useState(0);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [fichiers, setFichiers] = useState({
    photo: null,
    scan_passeport: null,
    scan_certificat_medical: null,
    scan_recu_versement: null,
  });
  const [agents, setAgents] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    utilisateurService.listerAgentsInscripteurs().then(({ data }) => setAgents(data));
    programmeService.lister().then(({ data }) => setProgrammes(data));

    if (modeEdition) {
      pelerinService.obtenir(id).then(({ data }) => {
        setValeurs({
          ...VALEURS_INITIALES,
          ...data,
          inscripteur: data.inscripteur || "",
          programme: data.programme || "",
        });
      });
    }
  }, [id]);

  const majChamp = (champ, valeur) => setValeurs((v) => ({ ...v, [champ]: valeur }));
  const majFichier = (champ, fichier) => setFichiers((f) => ({ ...f, [champ]: fichier }));

  const suivant = () => setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
  const precedent = () => setEtape((e) => Math.max(e - 1, 0));

  const handleSubmit = async () => {
    setErreur("");
    setEnvoi(true);
    try {
      const formData = new FormData();
      Object.entries(valeurs).forEach(([cle, val]) => {
        if (val !== null && val !== undefined && val !== "") formData.append(cle, val);
      });
      Object.entries(fichiers).forEach(([cle, fichier]) => {
        if (fichier) formData.append(cle, fichier);
      });

      if (modeEdition) {
        await pelerinService.modifier(id, formData);
      } else {
        await pelerinService.creer(formData);
      }
      navigate("/pelerins");
    } catch (err) {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.titre}>{modeEdition ? t("modifier_pelerin") : t("nouveau_pelerin")}</h1>

      <div className={styles.etapes}>
        {ETAPES.map((cle, index) => (
          <div
            key={cle}
            className={`${styles.puceEtape} ${index === etape ? styles.puceActive : ""} ${index < etape ? styles.puceComplete : ""}`}
            onClick={() => setEtape(index)}
          >
            <span className={styles.numeroEtape}>{index + 1}</span>
            <span className={styles.libelleEtape}>{t(`etape_${cle}`)}</span>
          </div>
        ))}
      </div>

      <div className={styles.carte}>
        {etape === 0 && (
          <div className={styles.grille}>
            <Champ label={t("prenom")}>
              <input value={valeurs.prenom} onChange={(e) => majChamp("prenom", e.target.value)} required />
            </Champ>
            <Champ label={t("nom")}>
              <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required />
            </Champ>
            <Champ label={t("sexe")}>
              <select value={valeurs.sexe} onChange={(e) => majChamp("sexe", e.target.value)} required>
                <option value="">—</option>
                <option value="M">{t("sexe_M")}</option>
                <option value="F">{t("sexe_F")}</option>
              </select>
            </Champ>
            <Champ label={t("date_naissance")}>
              <input type="date" value={valeurs.date_naissance} onChange={(e) => majChamp("date_naissance", e.target.value)} required />
            </Champ>
            <Champ label={t("lieu_naissance")}>
              <input value={valeurs.lieu_naissance} onChange={(e) => majChamp("lieu_naissance", e.target.value)} required />
            </Champ>
            <Champ label={t("photo")}>
              <input type="file" accept="image/*" onChange={(e) => majFichier("photo", e.target.files[0])} />
            </Champ>
          </div>
        )}

        {etape === 1 && (
          <div className={styles.grille}>
            <Champ label={t("numero_passeport")}>
              <input value={valeurs.numero_passeport} onChange={(e) => majChamp("numero_passeport", e.target.value)} required />
            </Champ>
            <Champ label={t("statut_visa")}>
              <select value={valeurs.statut_visa} onChange={(e) => majChamp("statut_visa", e.target.value)}>
                <option value="non_demande">{t("visa_non_demande")}</option>
                <option value="en_cours">{t("visa_en_cours")}</option>
                <option value="obtenu">{t("visa_obtenu")}</option>
                <option value="refuse">{t("visa_refuse")}</option>
              </select>
            </Champ>
            <Champ label={t("date_emission_passeport")}>
              <input type="date" value={valeurs.date_emission_passeport} onChange={(e) => majChamp("date_emission_passeport", e.target.value)} required />
            </Champ>
            <Champ label={t("date_expiration_passeport")}>
              <input type="date" value={valeurs.date_expiration_passeport} onChange={(e) => majChamp("date_expiration_passeport", e.target.value)} required />
            </Champ>
            <Champ label={t("scan_passeport")} pleineLargeur>
              <input type="file" accept="image/*,.pdf" onChange={(e) => majFichier("scan_passeport", e.target.files[0])} />
            </Champ>
          </div>
        )}

        {etape === 2 && (
          <div className={styles.grille}>
            <Champ label={t("commune")}>
              <input value={valeurs.commune} onChange={(e) => majChamp("commune", e.target.value)} required />
            </Champ>
            <Champ label={t("quartier")}>
              <input value={valeurs.quartier} onChange={(e) => majChamp("quartier", e.target.value)} required />
            </Champ>
            <Champ label={t("nom_pere")}>
              <input value={valeurs.nom_pere} onChange={(e) => majChamp("nom_pere", e.target.value)} />
            </Champ>
            <Champ label={t("nom_mere")}>
              <input value={valeurs.nom_mere} onChange={(e) => majChamp("nom_mere", e.target.value)} />
            </Champ>
          </div>
        )}

        {etape === 3 && (
          <div className={styles.grille}>
            <Champ label={t("telephone")}>
              <input value={valeurs.telephone} onChange={(e) => majChamp("telephone", e.target.value)} required />
            </Champ>
            <Champ label={t("nom_correspondant")}>
              <input value={valeurs.nom_correspondant} onChange={(e) => majChamp("nom_correspondant", e.target.value)} required />
            </Champ>
            <Champ label={t("telephone_correspondant")}>
              <input value={valeurs.telephone_correspondant} onChange={(e) => majChamp("telephone_correspondant", e.target.value)} required />
            </Champ>
            <Champ label={t("agence_partenaire")}>
              <input value={valeurs.agence_partenaire} onChange={(e) => majChamp("agence_partenaire", e.target.value)} placeholder={t("si_applicable")} />
            </Champ>
          </div>
        )}

        {etape === 4 && (
          <div className={styles.grille}>
            <Champ label={t("groupe_sanguin")}>
              <select value={valeurs.groupe_sanguin} onChange={(e) => majChamp("groupe_sanguin", e.target.value)}>
                <option value="">—</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Champ>
            <Champ label={t("probleme_sante")} pleineLargeur>
              <textarea rows={3} value={valeurs.probleme_sante} onChange={(e) => majChamp("probleme_sante", e.target.value)} placeholder={t("aucun_si_neant")} />
            </Champ>
            <Champ label={t("scan_certificat_medical")} pleineLargeur>
              <input type="file" accept="image/*,.pdf" onChange={(e) => majFichier("scan_certificat_medical", e.target.files[0])} />
            </Champ>
          </div>
        )}

        {etape === 5 && (
          <div className={styles.grille}>
            <Champ label={t("type_voyage")}>
              <select value={valeurs.type_voyage} onChange={(e) => majChamp("type_voyage", e.target.value)} required>
                <option value="">—</option>
                <option value="pelerinage">{t("type_pelerinage")}</option>
                <option value="oumra">{t("type_oumra")}</option>
                <option value="tourisme">{t("type_tourisme")}</option>
              </select>
            </Champ>
            <Champ label={t("inscripteur")}>
              <select value={valeurs.inscripteur} onChange={(e) => majChamp("inscripteur", e.target.value)} required>
                <option value="">—</option>
                {agents.map((a) => (
                <option key={a.id} value={a.id}>
                    {(a.first_name || a.last_name) ? `${a.first_name} ${a.last_name}` : a.username}
                </option>
                ))}
              </select>
            </Champ>
            <Champ label={t("programme")}>
              <select value={valeurs.programme} onChange={(e) => majChamp("programme", e.target.value)}>
                <option value="">{t("aucun_pour_le_moment")}</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </Champ>
            <Champ label={t("montant_verse")}>
              <input type="number" step="0.01" value={valeurs.montant_verse} onChange={(e) => majChamp("montant_verse", e.target.value)} />
            </Champ>
            <Champ label={t("scan_recu_versement")} pleineLargeur>
              <input type="file" accept="image/*,.pdf" onChange={(e) => majFichier("scan_recu_versement", e.target.files[0])} />
            </Champ>
          </div>
        )}

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        <div className={styles.navigation}>
          <button type="button" className={styles.boutonSecondaire} onClick={() => navigate("/pelerins")}>
            {t("annuler")}
          </button>
          <div className={styles.groupeDroite}>
            {etape > 0 && (
              <button type="button" className={styles.boutonSecondaire} onClick={precedent}>
                {t("precedent")}
              </button>
            )}
            {etape < ETAPES.length - 1 && (
              <button type="button" className={styles.boutonPrincipal} onClick={suivant}>
                {t("suivant")}
              </button>
            )}
            {etape === ETAPES.length - 1 && (
              <button type="button" className={styles.boutonPrincipal} onClick={handleSubmit} disabled={envoi}>
                {envoi ? t("enregistrement") : t("enregistrer")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Champ({ label, children, pleineLargeur }) {
  return (
    <div style={pleineLargeur ? { gridColumn: "1 / -1" } : {}}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

export default FormulairePelerin;