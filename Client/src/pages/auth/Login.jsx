import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { ENTREPRISE } from "../../config/config";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import styles from "../../theme/pages/auth/Login.module.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await connecter(username, password);
      navigate("/dashboard");
    } catch {
      setErreur(t("identifiants_incorrects"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panneauMarque}>
        <div className={styles.motif} />
        <div className={styles.motifSecondaire} />

        <div className={styles.enteteMarque}>
          <div className={styles.marqueHaut}>
            <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} className={styles.logoMarque} />
            <div>
              <p className={styles.nomMarque}>{ENTREPRISE.nomCourt}</p>
              <p className={styles.nomMarqueSousTitre}>{ENTREPRISE.nomComplet}</p>
            </div>
          </div>
          <LanguageSwitcher variant="sombre" />
        </div>

        <div className={styles.blocAccroche}>
          <p className={styles.accroche}>{t("accroche_login")}</p>
          <div className={styles.trait} />
          <p className={styles.slogan}>{ENTREPRISE.slogan}</p>
          <div className={styles.contact}>
            <span>{ENTREPRISE.telephones[0]}</span>
            <span>{ENTREPRISE.email}</span>
          </div>
        </div>
      </div>

      <div className={styles.panneauFormulaire}>
        <div className={styles.carte}>
          <div className={styles.enteteFormulaireMobile}>
            <div className={styles.logoMobile}>
              <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} />
              <p>{ENTREPRISE.nomCourt}</p>
            </div>
            <LanguageSwitcher />
          </div>

          <div className={styles.enteteFormulaireDesktop}>
            <LanguageSwitcher />
          </div>

          <h1 className={styles.titre}>{t("connexion")}</h1>
          <p className={styles.sousTitre}>{t("accedez_espace")}</p>

          <form onSubmit={handleSubmit} className={styles.formulaire}>
            <div className={styles.champ}>
              <label className={styles.label}>{t("nom_utilisateur")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className={styles.input}
              />
            </div>

            <div className={styles.champ}>
              <label className={styles.label}>{t("mot_de_passe")}</label>
              <div className={styles.enveloppeInput}>
                <input
                  type={motDePasseVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.boutonOeil}
                  onClick={() => setMotDePasseVisible((v) => !v)}
                >
                  {motDePasseVisible ? t("masquer") : t("afficher")}
                </button>
              </div>
            </div>

            <div className={styles.ligneOptions}>
              <a href="#" className={styles.lienMotDePasseOublie}>
                {t("mot_de_passe_oublie")}
              </a>
            </div>

            {erreur && <p className={styles.erreur}>{erreur}</p>}

            <button type="submit" disabled={envoi} className={styles.bouton}>
              {envoi ? t("connexion_en_cours") : t("se_connecter")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;