import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { personnelService } from "../../services/personnelService";
import { utilisateurService } from "../../services/utilisateurService";
import ChampFichier from "../../components/ChampFichier/ChampFichier";
import styles from "../../theme/pages/personnel/FormulairePersonnel.module.css";

const LANGUES_DISPONIBLES = ["francais", "arabe", "anglais", "peul", "malinke", "soussou"];

const VALEURS_INITIALES = {
  utilisateur: "", numero_piece_identite: "", date_naissance: "", commune: "",
  langues_parlees: [], nombre_saisons_experience: 0, contact_urgence_nom: "", contact_urgence_telephone: "",
  disponibilite: "actif",
  specialite_medicale: "", numero_ordre_medecins: "", etablissement_exercice: "",
  formation_religieuse: "", zone_competence: "",
  zone_affectation: "", capacite_max_pelerins: "",
};

function FormulairePersonnel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const modeEdition = Boolean(id);

  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [comptesDisponibles, setComptesDisponibles] = useState([]);
  const [roleActuel, setRoleActuel] = useState("");
  const [scanExistant, setScanExistant] = useState(null);
  const [nouveauScan, setNouveauScan] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [chargementInitial, setChargementInitial] = useState(modeEdition);

  useEffect(() => {
    if (!modeEdition) {
      utilisateurService.listerComptes().then(({ data }) => {
        setComptesDisponibles(data.filter((u) => ["guide", "encadreur", "docteur", "mounazim"].includes(u.role)));
      });
      const idPreselectionne = searchParams.get("utilisateur");
      if (idPreselectionne) {
        majChamp("utilisateur", idPreselectionne);
      }
    } else {
      personnelService.obtenir(id).then(({ data }) => {
        setValeurs({
          ...VALEURS_INITIALES,
          ...data,
          langues_parlees: data.langues_parlees ? data.langues_parlees.split(",") : [],
        });
        setRoleActuel(data.utilisateur_role);
        setScanExistant(data.scan_cv || null);
        setChargementInitial(false);
      });
    }
  }, [id]);

  const majChamp = (champ, valeur) => setValeurs((v) => ({ ...v, [champ]: valeur }));

  const basculerLangue = (langue) => {
    setValeurs((v) => ({
      ...v,
      langues_parlees: v.langues_parlees.includes(langue)
        ? v.langues_parlees.filter((l) => l !== langue)
        : [...v.langues_parlees, langue],
    }));
  };

  const handleChangementUtilisateur = (idUtilisateur) => {
    majChamp("utilisateur", idUtilisateur);
    const compte = comptesDisponibles.find((c) => String(c.id) === String(idUtilisateur));
    setRoleActuel(compte?.role || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const formData = new FormData();
      Object.entries(valeurs).forEach(([champ, val]) => {
        if (champ === "langues_parlees") {
          formData.append(champ, val.join(","));
        } else if (val !== null && val !== undefined && val !== "") {
          formData.append(champ, val);
        }
      });
      if (nouveauScan) formData.append("scan_cv", nouveauScan);

      if (modeEdition) {
        await personnelService.modifier(id, formData);
      } else {
        await personnelService.creer(formData);
      }
      navigate("/personnel");
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

  if (chargementInitial) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.titre}>{modeEdition ? t("modifier_fiche_personnel") : t("nouvelle_fiche_personnel")}</h1>

      <div className={styles.carte}>
        <form onSubmit={handleSubmit}>
          {!modeEdition && (
            <div className={styles.champ}>
              <label>{t("selectionner_compte")}</label>
              <select value={valeurs.utilisateur} onChange={(e) => handleChangementUtilisateur(e.target.value)} required>
                <option value="">—</option>
                {comptesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.role_display})</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.sectionTitre}>{t("section_infos_communes")}</div>
          <div className={styles.grille}>
            <div className={styles.champ}>
              <label>{t("numero_piece_identite")}</label>
              <input value={valeurs.numero_piece_identite} onChange={(e) => majChamp("numero_piece_identite", e.target.value)} />
            </div>
            <div className={styles.champ}>
              <label>{t("date_naissance")}</label>
              <input type="date" value={valeurs.date_naissance} onChange={(e) => majChamp("date_naissance", e.target.value)} />
            </div>
            <div className={styles.champ}>
              <label>{t("commune")}</label>
              <input value={valeurs.commune} onChange={(e) => majChamp("commune", e.target.value)} />
            </div>
            <div className={styles.champ}>
              <label>{t("nombre_saisons_experience")}</label>
              <input type="number" min="0" value={valeurs.nombre_saisons_experience} onChange={(e) => majChamp("nombre_saisons_experience", e.target.value)} />
            </div>
            <div className={styles.champ}>
              <label>{t("disponibilite")}</label>
              <select value={valeurs.disponibilite} onChange={(e) => majChamp("disponibilite", e.target.value)}>
                <option value="actif">{t("disponibilite_actif")}</option>
                <option value="conge">{t("disponibilite_conge")}</option>
                <option value="indisponible">{t("disponibilite_indisponible")}</option>
              </select>
            </div>
          </div>

          <div className={styles.champ}>
            <label>{t("langues_parlees")}</label>
            <div className={styles.groupeLangues}>
              {LANGUES_DISPONIBLES.map((langue) => (
                <label key={langue} className={styles.checkboxLangue}>
                  <input
                    type="checkbox"
                    checked={valeurs.langues_parlees.includes(langue)}
                    onChange={() => basculerLangue(langue)}
                  />
                  {t(`langue_${langue}`)}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.sectionTitre}>{t("section_contact_urgence")}</div>
          <div className={styles.grille}>
            <div className={styles.champ}>
              <label>{t("nom_correspondant")}</label>
              <input value={valeurs.contact_urgence_nom} onChange={(e) => majChamp("contact_urgence_nom", e.target.value)} />
            </div>
            <div className={styles.champ}>
              <label>{t("telephone")}</label>
              <input value={valeurs.contact_urgence_telephone} onChange={(e) => majChamp("contact_urgence_telephone", e.target.value)} />
            </div>
          </div>

          {roleActuel === "docteur" && (
            <>
              <div className={styles.sectionTitre}>{t("section_infos_medecin")}</div>
              <div className={styles.grille}>
                <div className={styles.champ}>
                  <label>{t("specialite_medicale")}</label>
                  <input value={valeurs.specialite_medicale} onChange={(e) => majChamp("specialite_medicale", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("numero_ordre_medecins")}</label>
                  <input value={valeurs.numero_ordre_medecins} onChange={(e) => majChamp("numero_ordre_medecins", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("etablissement_exercice")}</label>
                  <input value={valeurs.etablissement_exercice} onChange={(e) => majChamp("etablissement_exercice", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {(roleActuel === "guide" || roleActuel === "mounazim") && (
            <>
              <div className={styles.sectionTitre}>{t("section_infos_guide")}</div>
              <div className={styles.grille}>
                <div className={styles.champ}>
                  <label>{t("formation_religieuse")}</label>
                  <input value={valeurs.formation_religieuse} onChange={(e) => majChamp("formation_religieuse", e.target.value)} />
                </div>
                <div className={styles.champ}>
                  <label>{t("zone_competence")}</label>
                  <select value={valeurs.zone_competence} onChange={(e) => majChamp("zone_competence", e.target.value)}>
                    <option value="">—</option>
                    <option value="mecque">{t("ville_mecque")}</option>
                    <option value="medine">{t("ville_medine")}</option>
                    <option value="les_deux">{t("les_deux_villes")}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {roleActuel === "encadreur" && (
            <>
              <div className={styles.sectionTitre}>{t("section_infos_encadreur")}</div>
              <div className={styles.grille}>
                <div className={styles.champ}>
                  <label>{t("zone_affectation")}</label>
                  <select value={valeurs.zone_affectation} onChange={(e) => majChamp("zone_affectation", e.target.value)}>
                    <option value="">—</option>
                    <option value="mecque">{t("ville_mecque")}</option>
                    <option value="medine">{t("ville_medine")}</option>
                    <option value="transport">{t("zone_transport")}</option>
                    <option value="aeroport">{t("zone_aeroport")}</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("capacite_max_pelerins")}</label>
                  <input type="number" min="0" value={valeurs.capacite_max_pelerins} onChange={(e) => majChamp("capacite_max_pelerins", e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className={styles.sectionTitre}>{t("section_documents")}</div>
          <ChampFichier
            label={t("scan_cv")}
            valeurActuelle={scanExistant}
            onFichierChange={setNouveauScan}
          />

          {erreur && <p className={styles.erreur}>{erreur}</p>}

          <div className={styles.navigation}>
            <button type="button" className={styles.boutonSecondaire} onClick={() => navigate("/personnel")}>
              {t("annuler")}
            </button>
            <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>
              {envoi ? t("enregistrement") : t("enregistrer")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormulairePersonnel;