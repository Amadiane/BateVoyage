import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { pelerinService } from "../../services/pelerinService";
import ChampFichier from "../../components/ChampFichier/ChampFichier";
import styles from "../../theme/pages/pelerins/FormulairePelerin.module.css";

const ETAPES = ["identite_passeport", "adresse_contact", "sante_inscription"];

const AGENCES_PARTENAIRES = [
  "BATE VOYAGE GUINÉE",
  "UNION VOYAGES GUINÉE",
  "NOUR-MAKKAH",
  "INTER-DJIGUI",
  "MOHAMED FADIGA",
  "MANDENG VOYAGE GUINÉE",
  "WARASSIMASSA",
];

const INSCRIPTEURS = [
  "Nfamba Kaba",
  "Laye Mady Diallo",
  "Laye Abou Diallo",
  "Nfamba Keïta",
  "Minata Mady",
  "Boh Kabinet",
  "Hadja Fatou Diallo",
  "Hadja Fanta Oulen",
];

const LABELS_TYPE_VOYAGE = {
  pelerinage: "type_pelerinage",
  oumra: "type_oumra",
  tourisme: "type_tourisme",
};

const VALEURS_INITIALES = {
  prenom: "", nom: "", sexe: "", date_naissance: "", lieu_naissance: "",
  numero_passeport: "", date_emission_passeport: "", date_expiration_passeport: "", statut_visa: "non_demande",
  biometrie_effectuee: false, date_biometrie: "",
  commune: "", quartier: "", nom_pere: "", nom_mere: "",
  telephone: "", nom_correspondant: "", telephone_correspondant: "", agence_partenaire: "",
  groupe_sanguin: "", probleme_sante: "",
  type_voyage: "", montant_verse: "", mode_paiement: "", inscripteur: "",
};

const CHAMPS_FICHIERS = ["photo", "scan_passeport", "scan_visa", "scan_certificat_medical", "scan_recu_versement"];

const CHAMPS_REQUIS_PAR_ETAPE = {
  0: ["prenom", "nom", "sexe", "date_naissance", "lieu_naissance",
      "numero_passeport", "date_emission_passeport", "date_expiration_passeport"],
  1: ["commune", "quartier", "telephone", "nom_correspondant", "telephone_correspondant"],
  2: ["inscripteur"],
};

function FormulairePelerin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const modeEdition = Boolean(id);
  const typeVoyageFixe = searchParams.get("type");

  const [etape, setEtape] = useState(0);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [fichiers, setFichiers] = useState({
    photo: null,
    scan_passeport: null,
    scan_visa: null,
    scan_certificat_medical: null,
    scan_recu_versement: null,
  });
  const [documentsExistants, setDocumentsExistants] = useState({});
  const [montantTotalExistant, setMontantTotalExistant] = useState(0);

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [champsManquants, setChampsManquants] = useState([]);
  const [chargementInitial, setChargementInitial] = useState(modeEdition);
  const [pelerinEnregistre, setPelerinEnregistre] = useState(null);

  useEffect(() => {
    if (modeEdition) {
      pelerinService.obtenir(id).then(({ data }) => {
        const valeursTexte = {};
        Object.keys(VALEURS_INITIALES).forEach((champ) => {
          const val = data[champ];
          valeursTexte[champ] = val === null || val === undefined ? VALEURS_INITIALES[champ] : val;
        });
        setValeurs(valeursTexte);
        setMontantTotalExistant(data.montant_total_verse || 0);

        const docs = {};
        CHAMPS_FICHIERS.forEach((champ) => {
          docs[champ] = data[champ] || null;
        });
        setDocumentsExistants(docs);

        setChargementInitial(false);
      });
    } else if (typeVoyageFixe) {
      setValeurs((v) => ({ ...v, type_voyage: typeVoyageFixe }));
    }
  }, [id]);

  const majChamp = (champ, valeur) => {
    setValeurs((v) => ({ ...v, [champ]: valeur }));
    setChampsManquants((liste) => liste.filter((c) => c !== champ));
  };
  const majFichier = (champ, fichier) => setFichiers((f) => ({ ...f, [champ]: fichier }));

  const validerEtape = (indexEtape) => {
    const requis = CHAMPS_REQUIS_PAR_ETAPE[indexEtape] || [];
    const manquants = requis.filter((champ) => !String(valeurs[champ] || "").trim());
    setChampsManquants(manquants);
    if (manquants.length > 0) {
      setErreur(t("champs_obligatoires_manquants"));
      return false;
    }
    setErreur("");
    return true;
  };

  const suivant = () => {
    if (!validerEtape(etape)) return;
    setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
  };
  const precedent = () => {
    setErreur("");
    setEtape((e) => Math.max(e - 1, 0));
  };

  const cheminRetour = () =>
    typeVoyageFixe === "pelerinage" ? "/hajj/pelerins/liste" : typeVoyageFixe === "oumra" ? "/oumra/pelerins/liste" : "/pelerins";

  const continuerMalgreManquants = () => {
    navigate(cheminRetour());
  };

  const handleSubmit = async () => {
    if (!validerEtape(etape)) return;

    setErreur("");
    setEnvoi(true);
    try {
      const formData = new FormData();
      Object.keys(VALEURS_INITIALES).forEach((champ) => {
        if (modeEdition && (champ === "montant_verse" || champ === "mode_paiement")) return;
        if (champ === "date_biometrie" && !valeurs.biometrie_effectuee) return;

        const val = valeurs[champ];
        if (champ === "biometrie_effectuee") {
          formData.append(champ, val ? "true" : "false");
          return;
        }
        if (val !== null && val !== undefined && val !== "") {
          formData.append(champ, val);
        }
      });

      Object.entries(fichiers).forEach(([champ, fichier]) => {
        if (fichier) formData.append(champ, fichier);
      });

      let resultat;
      if (modeEdition) {
        resultat = await pelerinService.modifier(id, formData);
      } else {
        resultat = await pelerinService.creer(formData);
      }

      if (resultat.data.elements_manquants && resultat.data.elements_manquants.length > 0) {
        setPelerinEnregistre(resultat.data);
      } else {
        navigate(cheminRetour());
      }
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

  const estManquant = (champ) => champsManquants.includes(champ);

  if (chargementInitial) {
    return <p className={styles.chargement}>{t("chargement")}</p>;
  }

  if (!modeEdition && !typeVoyageFixe) {
    return (
      <div className={styles.page}>
        <h1 className={styles.titre}>{t("choisir_type_voyage")}</h1>
        <div className={styles.choixType}>
          <button className={styles.carteChoixType} onClick={() => navigate("/pelerins/nouveau?type=pelerinage")}>
            🕋 {t("type_pelerinage")}
          </button>
          <button className={styles.carteChoixType} onClick={() => navigate("/pelerins/nouveau?type=oumra")}>
            🌙 {t("type_oumra")}
          </button>
        </div>
      </div>
    );
  }

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
          <>
            <div className={styles.sectionTitre}>{t("etape_identite")}</div>
            <div className={styles.grille}>
              <Champ label={t("prenom")} manquant={estManquant("prenom")}>
                <input value={valeurs.prenom} onChange={(e) => majChamp("prenom", e.target.value)} />
              </Champ>
              <Champ label={t("nom")} manquant={estManquant("nom")}>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} />
              </Champ>
              <Champ label={t("sexe")} manquant={estManquant("sexe")}>
                <select value={valeurs.sexe} onChange={(e) => majChamp("sexe", e.target.value)}>
                  <option value="">—</option>
                  <option value="M">{t("sexe_M")}</option>
                  <option value="F">{t("sexe_F")}</option>
                </select>
              </Champ>
              <Champ label={t("date_naissance")} manquant={estManquant("date_naissance")}>
                <input type="date" value={valeurs.date_naissance} onChange={(e) => majChamp("date_naissance", e.target.value)} />
              </Champ>
              <Champ label={t("lieu_naissance")} manquant={estManquant("lieu_naissance")}>
                <input value={valeurs.lieu_naissance} onChange={(e) => majChamp("lieu_naissance", e.target.value)} />
              </Champ>
              <ChampFichier
                label={t("photo")}
                valeurActuelle={documentsExistants.photo}
                onFichierChange={(f) => majFichier("photo", f)}
                accept="image/*"
              />
            </div>

            <div className={styles.sectionTitre}>{t("etape_passeport")}</div>
            <div className={styles.grille}>
              <Champ label={t("numero_passeport")} manquant={estManquant("numero_passeport")}>
                <input value={valeurs.numero_passeport} onChange={(e) => majChamp("numero_passeport", e.target.value)} />
              </Champ>
              <Champ label={t("statut_visa")}>
                <select value={valeurs.statut_visa} onChange={(e) => majChamp("statut_visa", e.target.value)}>
                  <option value="non_demande">{t("visa_non_demande")}</option>
                  <option value="en_cours">{t("visa_en_cours")}</option>
                  <option value="obtenu">{t("visa_obtenu")}</option>
                  <option value="refuse">{t("visa_refuse")}</option>
                  <option value="expire">{t("visa_expire")}</option>
                </select>
              </Champ>
              <Champ label={t("date_emission_passeport")} manquant={estManquant("date_emission_passeport")}>
                <input type="date" value={valeurs.date_emission_passeport} onChange={(e) => majChamp("date_emission_passeport", e.target.value)} />
              </Champ>
              <Champ label={t("date_expiration_passeport")} manquant={estManquant("date_expiration_passeport")}>
                <input type="date" value={valeurs.date_expiration_passeport} onChange={(e) => majChamp("date_expiration_passeport", e.target.value)} />
              </Champ>
              <Champ label={t("biometrie_effectuee")}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={valeurs.biometrie_effectuee}
                    onChange={(e) => majChamp("biometrie_effectuee", e.target.checked)}
                  />
                  {t("biometrie_faite")}
                </label>
              </Champ>
              {valeurs.biometrie_effectuee && (
                <Champ label={t("date_biometrie")}>
                  <input type="date" value={valeurs.date_biometrie} onChange={(e) => majChamp("date_biometrie", e.target.value)} />
                </Champ>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <ChampFichier
                  label={t("scan_passeport")}
                  valeurActuelle={documentsExistants.scan_passeport}
                  onFichierChange={(f) => majFichier("scan_passeport", f)}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <ChampFichier
                  label={t("scan_visa")}
                  valeurActuelle={documentsExistants.scan_visa}
                  onFichierChange={(f) => majFichier("scan_visa", f)}
                />
              </div>
            </div>
          </>
        )}

        {etape === 1 && (
          <>
            <div className={styles.sectionTitre}>{t("etape_adresse")}</div>
            <div className={styles.grille}>
              <Champ label={t("commune")} manquant={estManquant("commune")}>
                <input value={valeurs.commune} onChange={(e) => majChamp("commune", e.target.value)} />
              </Champ>
              <Champ label={t("quartier")} manquant={estManquant("quartier")}>
                <input value={valeurs.quartier} onChange={(e) => majChamp("quartier", e.target.value)} />
              </Champ>
              <Champ label={t("nom_pere")}>
                <input value={valeurs.nom_pere} onChange={(e) => majChamp("nom_pere", e.target.value)} />
              </Champ>
              <Champ label={t("nom_mere")}>
                <input value={valeurs.nom_mere} onChange={(e) => majChamp("nom_mere", e.target.value)} />
              </Champ>
            </div>

            <div className={styles.sectionTitre}>{t("etape_contact")}</div>
            <div className={styles.grille}>
              <Champ label={t("telephone")} manquant={estManquant("telephone")}>
                <input value={valeurs.telephone} onChange={(e) => majChamp("telephone", e.target.value)} />
              </Champ>
              <Champ label={t("nom_correspondant")} manquant={estManquant("nom_correspondant")}>
                <input value={valeurs.nom_correspondant} onChange={(e) => majChamp("nom_correspondant", e.target.value)} />
              </Champ>
              <Champ label={t("telephone_correspondant")} manquant={estManquant("telephone_correspondant")}>
                <input value={valeurs.telephone_correspondant} onChange={(e) => majChamp("telephone_correspondant", e.target.value)} />
              </Champ>
              <Champ label={t("agence_partenaire")}>
                <select value={valeurs.agence_partenaire} onChange={(e) => majChamp("agence_partenaire", e.target.value)}>
                  <option value="">{t("aucune_agence")}</option>
                  {AGENCES_PARTENAIRES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Champ>
            </div>
          </>
        )}

        {etape === 2 && (
          <>
            {typeVoyageFixe && (
              <div className={styles.noteTypeFixe}>
                🧭 {t("inscription_pour")} : <strong>{t(LABELS_TYPE_VOYAGE[typeVoyageFixe] || typeVoyageFixe)}</strong>
              </div>
            )}

            <div className={styles.sectionTitre}>{t("etape_sante")}</div>
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
              <div style={{ gridColumn: "1 / -1" }}>
                <ChampFichier
                  label={t("scan_certificat_medical")}
                  valeurActuelle={documentsExistants.scan_certificat_medical}
                  onFichierChange={(f) => majFichier("scan_certificat_medical", f)}
                />
              </div>
            </div>

            <div className={styles.sectionTitre}>{t("etape_documents")}</div>
            <div className={styles.grille}>
              {!typeVoyageFixe && (
                <Champ label={t("type_voyage")} manquant={estManquant("type_voyage")}>
                  <select value={valeurs.type_voyage} onChange={(e) => majChamp("type_voyage", e.target.value)}>
                    <option value="">—</option>
                    <option value="pelerinage">{t("type_pelerinage")}</option>
                    <option value="oumra">{t("type_oumra")}</option>
                    <option value="tourisme">{t("type_tourisme")}</option>
                  </select>
                </Champ>
              )}
              <Champ label={t("inscripteur")} manquant={estManquant("inscripteur")}>
                <select value={valeurs.inscripteur} onChange={(e) => majChamp("inscripteur", e.target.value)}>
                  <option value="">—</option>
                  {INSCRIPTEURS.map((nom) => (
                    <option key={nom} value={nom}>{nom}</option>
                  ))}
                </select>
              </Champ>

              {!modeEdition && (
                <>
                  <Champ label={t("montant_verse")}>
                    <input type="number" step="0.01" value={valeurs.montant_verse} onChange={(e) => majChamp("montant_verse", e.target.value)} />
                  </Champ>
                  <Champ label={t("mode_paiement")}>
                    <select value={valeurs.mode_paiement} onChange={(e) => majChamp("mode_paiement", e.target.value)}>
                      <option value="">—</option>
                      <option value="especes">{t("mode_especes")}</option>
                      <option value="orange_money">{t("mode_orange_money")}</option>
                      <option value="virement">{t("mode_virement")}</option>
                    </select>
                  </Champ>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <ChampFichier
                      label={t("scan_recu_versement")}
                      valeurActuelle={documentsExistants.scan_recu_versement}
                      onFichierChange={(f) => majFichier("scan_recu_versement", f)}
                    />
                  </div>
                </>
              )}

              {modeEdition && (
                <div className={styles.noteMontant} style={{ gridColumn: "1 / -1" }}>
                  <p className={styles.texteNoteMontant}>
                    💰 {t("montant_deja_verse")} : <strong>{montantTotalExistant.toLocaleString("fr-FR")} GNF</strong>
                  </p>
                  <p className={styles.texteNoteMontantSecondaire}>{t("note_ajout_paiement")}</p>
                </div>
              )}
            </div>
          </>
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

      {pelerinEnregistre && (
        <div className={styles.superpositionAlerte} onClick={continuerMalgreManquants}>
          <div className={styles.panneauAlerte} onClick={(e) => e.stopPropagation()}>
            <div className={styles.iconeAlerteCercle}>⚠️</div>
            <h2 className={styles.titreAlerte}>{t("pelerin_enregistre_mais")}</h2>
            <p className={styles.sousTitreAlerte}>{t("elements_a_completer")}</p>
            <ul className={styles.listeManquants}>
              {pelerinEnregistre.elements_manquants.map((el) => (
                <li key={el} className={styles.itemManquant}>{t(`manquant_${el}`)}</li>
              ))}
            </ul>
            <div className={styles.actionsAlerte}>
              <button className={styles.boutonCompleterMaintenant} onClick={() => setPelerinEnregistre(null)}>
                {t("completer_maintenant")}
              </button>
              <button className={styles.boutonContinuerPlusTard} onClick={continuerMalgreManquants}>
                {t("continuer_plus_tard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Champ({ label, children, pleineLargeur, manquant }) {
  return (
    <div style={pleineLargeur ? { gridColumn: "1 / -1" } : {}}>
      <label className={styles.label}>
        {label}
        {manquant && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default FormulairePelerin;