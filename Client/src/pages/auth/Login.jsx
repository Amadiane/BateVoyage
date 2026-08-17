import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { ENTREPRISE } from "../../config/config";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import imageKaaba from "../../assets/images/kaaba.jpg";
import styles from "../../theme/pages/auth/Login.module.css";

export default function Login() {
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
    <div className={styles.container}>
      {/* Partie gauche */}
      <div className={styles.left} style={{ backgroundImage: `url(${imageKaaba})` }}>
        <div className={styles.overlay}></div>

        <div className={styles.topLogo}>
          <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} />
          <span>{t("etiquette_arabe")}</span>
          <div className={styles.langueTopLogo}>
            <LanguageSwitcher variant="sombre" />
          </div>
        </div>

        <div className={styles.bottom}>
          <h2>HAJJ & OUMRA</h2>
          <p dangerouslySetInnerHTML={{ __html: t("accroche_login_html") }} />

          <div className={styles.features}>
            <div>
              🕋
              <span>HAJJ</span>
            </div>
            <div>
              🌙
              <span>OUMRA</span>
            </div>
            <div>
              🕌
              <span>{t("service")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite */}
      <div className={styles.right}>
        <div className={styles.card}>
          <img src={ENTREPRISE.logo} alt="" className={styles.logo} />

          <h1>BATE VOYAGE</h1>
          <h2>GUINÉE</h2>
          <h3>HAJJ & OUMRA</h3>

          <p className={styles.subtitle}>{t("accedez_espace")}</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.input}>
              <FaUser />
              <input
                type="text"
                placeholder={t("nom_utilisateur")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={styles.input}>
              <FaLock />
              <input
                type={motDePasseVisible ? "text" : "password"}
                placeholder={t("mot_de_passe")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.boutonOeil}
                onClick={() => setMotDePasseVisible((v) => !v)}
              >
                {motDePasseVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className={styles.options}>
              <label>
                <input
                  type="checkbox"
                  checked={seSouvenir}
                  onChange={(e) => setSeSouvenir(e.target.checked)}
                />
                {t("se_souvenir_de_moi")}
              </label>
              <a href="#">{t("mot_de_passe_oublie")}</a>
            </div>

            {erreur && <p className={styles.erreur}>{erreur}</p>}

            <button type="submit" className={styles.loginBtn} disabled={envoi}>
              <FiLogIn />
              {envoi ? t("connexion_en_cours") : t("se_connecter")}
            </button>
          </form>

          <div className={styles.secure}>🔒 {t("connexion_securisee")}</div>
        </div>
      </div>
    </div>
  );
}