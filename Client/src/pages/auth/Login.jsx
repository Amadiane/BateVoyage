import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { ENTREPRISE } from "../../config/config";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import styles from "../../theme/pages/auth/Login.module.css";
import imageKaaba from "../../assets/images/kaaba.jpg";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [seSouvenir, setSeSouvenir] = useState(true);
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
      await connecter(username, password, seSouvenir);
      navigate("/dashboard");
    } catch {
      setErreur(t("identifiants_incorrects"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.cadre}>

        {/* Panneau de marque */}
        <div className={styles.panneauMarque}>
          <div className={styles.imageFond} style={{ backgroundImage: `url(${imageKaaba})` }} />
          <div className={styles.degrade} />

          <div className={styles.courbeDoree} aria-hidden="true">
            <svg viewBox="0 0 24 800" preserveAspectRatio="none" className={styles.svgCourbe}>
              <path
                d="M12,0 C22,150 2,300 12,400 C22,500 2,650 12,800"
                fill="none"
                stroke="url(#degradeOr)"
                strokeWidth="3"
              />
              <defs>
                <linearGradient id="degradeOr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C7A44A" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#E8C766" stopOpacity="1" />
                  <stop offset="100%" stopColor="#C7A44A" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className={styles.enteteMarque}>
            <span className={styles.etiquetteArabe}>الحج والعمرة</span>
            <LanguageSwitcher variant="sombre" />
          </div>

          <div className={styles.blocAccroche}>
            <p className={styles.accroche}>{t("accroche_login")}</p>
            <div className={styles.trait} />
            <p className={styles.slogan}>{ENTREPRISE.slogan}</p>
          </div>

          <div className={styles.ligneIcones}>
            <div className={styles.iconeService}>
              <span className={styles.iconeSymbole}>🕋</span>
              <span>Hajj</span>
            </div>
            <div className={styles.iconeService}>
              <span className={styles.iconeSymbole}>☪</span>
              <span>Omra</span>
            </div>
            <div className={styles.iconeService}>
              <span className={styles.iconeSymbole}>✦</span>
              <span>{t("service_qualite")}</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.panneauFormulaire}>
          <div className={styles.carte}>
            <div className={styles.logoDesktop}>
              <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} />
              <div>
                <p className={styles.nomMarque}>{ENTREPRISE.nomComplet}</p>
                <p className={styles.sousNomMarque}>HAJJ & OMRA MANAGEMENT SYSTEM</p>
              </div>
            </div>

            <h1 className={styles.titre}>{t("bienvenue")}</h1>
            <p className={styles.sousTitre}>{t("accedez_espace")}</p>

            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label className={styles.label}>{t("nom_utilisateur")}</label>
                <div className={styles.enveloppeInput}>
                  <span className={styles.iconeChamp}>👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.champ}>
                <label className={styles.label}>{t("mot_de_passe")}</label>
                <div className={styles.enveloppeInput}>
                  <span className={styles.iconeChamp}>🔒</span>
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
                    {motDePasseVisible ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className={styles.ligneOptions}>
                <label className={styles.caseSouvenir}>
                  <input type="checkbox" checked={seSouvenir} onChange={(e) => setSeSouvenir(e.target.checked)} />
                  {t("se_souvenir_de_moi")}
                </label>
                <a href="#" className={styles.lienMotDePasseOublie}>
                  {t("mot_de_passe_oublie")}
                </a>
              </div>

              {erreur && <p className={styles.erreur}>{erreur}</p>}

              <button type="submit" disabled={envoi} className={styles.bouton}>
                {envoi ? t("connexion_en_cours") : t("se_connecter")}
              </button>
            </form>

            <div className={styles.piedCarte}>
              <span className={styles.iconeSecurite}>🛡</span> {t("connexion_securisee")}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;