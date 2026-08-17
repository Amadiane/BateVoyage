import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { utilisateurService } from "../../services/utilisateurService";
import styles from "../../theme/pages/utilisateurs/FormulaireUtilisateur.module.css";

const ROLES = [
  "fondateur", "admin_general", "comptable", "secretaire", "docteur",
  "traducteur", "affaires_sociales", "guide", "encadreur", "mounazim", "pelerin",
];

const VALEURS_INITIALES = {
  username: "", first_name: "", last_name: "", email: "", telephone: "", role: "", actif: true,
};

function FormulaireUtilisateur() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const modeEdition = Boolean(id);

  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [motDePasse, setMotDePasse] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoiMotDePasse, setEnvoiMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messageMotDePasse, setMessageMotDePasse] = useState("");
  const [chargementInitial, setChargementInitial] = useState(modeEdition);

  useEffect(() => {
    if (modeEdition) {
      utilisateurService.obtenirCompte(id).then(({ data }) => {
        setValeurs({
          username: data.username, first_name: data.first_name, last_name: data.last_name,
          email: data.email, telephone: data.telephone || "", role: data.role, actif: data.actif,
        });
        setChargementInitial(false);
      });
    }
  }, [id]);

  const majChamp = (champ, valeur) => setValeurs((v) => ({ ...v, [champ]: valeur }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      if (modeEdition) {
        await utilisateurService.modifierCompte(id, valeurs);
      } else {
        await utilisateurService.creerCompte({ ...valeurs, password: motDePasse });
      }
      navigate("/utilisateurs");
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

  const handleModifierMotDePasse = async () => {
    if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
      setMessageMotDePasse(t("mot_de_passe_trop_court"));
      return;
    }
    setEnvoiMotDePasse(true);
    setMessageMotDePasse("");
    try {
      await utilisateurService.modifierMotDePasse(id, nouveauMotDePasse);
      setMessageMotDePasse(t("mot_de_passe_modifie"));
      setNouveauMotDePasse("");
    } catch {
      setMessageMotDePasse(t("erreur_enregistrement"));
    } finally {
      setEnvoiMotDePasse(false);
    }
  };

  if (chargementInitial) return <p className={styles.chargement}>{t("chargement")}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.titre}>{modeEdition ? t("modifier_utilisateur") : t("nouveau_utilisateur")}</h1>

      <div className={styles.carte}>
        <form onSubmit={handleSubmit}>
          <div className={styles.grille}>
            <Champ label={t("prenom")}>
              <input value={valeurs.first_name} onChange={(e) => majChamp("first_name", e.target.value)} required />
            </Champ>
            <Champ label={t("nom")}>
              <input value={valeurs.last_name} onChange={(e) => majChamp("last_name", e.target.value)} required />
            </Champ>
            <Champ label={t("nom_utilisateur_champ")}>
              <input value={valeurs.username} onChange={(e) => majChamp("username", e.target.value)} required disabled={modeEdition} />
            </Champ>
            <Champ label={t("email")}>
              <input type="email" value={valeurs.email} onChange={(e) => majChamp("email", e.target.value)} />
            </Champ>
            <Champ label={t("telephone")}>
              <input value={valeurs.telephone} onChange={(e) => majChamp("telephone", e.target.value)} />
            </Champ>
            <Champ label={t("role")}>
              <select value={valeurs.role} onChange={(e) => majChamp("role", e.target.value)} required>
                <option value="">—</option>
                {ROLES.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
              </select>
            </Champ>

            {!modeEdition && (
              <Champ label={t("mot_de_passe")} pleineLargeur>
                <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required minLength={6} />
              </Champ>
            )}

            {modeEdition && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label className={styles.label}>
                  <input type="checkbox" checked={valeurs.actif} onChange={(e) => majChamp("actif", e.target.checked)} />
                  {" "}{t("compte_actif")}
                </label>
              </div>
            )}
          </div>

          {erreur && <p className={styles.erreur}>{erreur}</p>}

          <div className={styles.navigation}>
            <button type="button" className={styles.boutonSecondaire} onClick={() => navigate("/utilisateurs")}>
              {t("annuler")}
            </button>
            <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>
              {envoi ? t("enregistrement") : t("enregistrer")}
            </button>
          </div>
        </form>
      </div>

      {modeEdition && (
        <div className={styles.carte}>
          <h2 className={styles.titreSection}>{t("reinitialiser_mot_de_passe")}</h2>
          <div className={styles.ligneMotDePasse}>
            <input
              type="password"
              placeholder={t("nouveau_mot_de_passe")}
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              className={styles.inputMotDePasse}
            />
            <button
              type="button"
              className={styles.boutonSecondaire}
              onClick={handleModifierMotDePasse}
              disabled={envoiMotDePasse}
            >
              {envoiMotDePasse ? t("enregistrement") : t("valider")}
            </button>
          </div>
          {messageMotDePasse && <p className={styles.messageMotDePasse}>{messageMotDePasse}</p>}
        </div>
      )}
    </div>
  );
}

function Champ({ label, children, pleineLargeur }) {
  return (
    <div style={pleineLargeur ? { gridColumn: "1 / -1" } : {}}>
      <label className={pleineLargeur ? undefined : undefined}>{label}</label>
      {children}
    </div>
  );
}

export default FormulaireUtilisateur;