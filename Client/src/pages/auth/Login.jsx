import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENTREPRISE } from "../../config/config";
import styles from "../../theme/pages/auth/Login.module.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await connecter(username, password);
      navigate("/dashboard");
    } catch {
      setErreur("Identifiant ou mot de passe incorrect.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panneauMarque}>
        <div className={styles.motif} />
        <div className={styles.motifSecondaire} />

        <div className={styles.marqueHaut}>
          <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} className={styles.logoMarque} />
          <div>
            <p className={styles.nomMarque}>{ENTREPRISE.nomCourt}</p>
            <p className={styles.nomMarqueSousTitre}>{ENTREPRISE.nomComplet}</p>
          </div>
        </div>

        <div className={styles.blocAccroche}>
          <p className={styles.accroche}>De la préparation à La Mecque, jusqu'au retour.</p>
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
          <div className={styles.logoMobile}>
            <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} />
            <p>{ENTREPRISE.nomCourt}</p>
          </div>

          <h1 className={styles.titre}>Connexion</h1>
          <p className={styles.sousTitre}>Accédez à votre espace de gestion</p>

          <form onSubmit={handleSubmit} className={styles.formulaire}>
            <div className={styles.champ}>
              <label className={styles.label}>Nom d'utilisateur</label>
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
              <label className={styles.label}>Mot de passe</label>
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
                  {motDePasseVisible ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div className={styles.ligneOptions}>
              <a href="#" className={styles.lienMotDePasseOublie}>
                Mot de passe oublié ?
              </a>
            </div>

            {erreur && <p className={styles.erreur}>{erreur}</p>}

            <button type="submit" disabled={envoi} className={styles.bouton}>
              {envoi ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;