import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/pages/dashboard/Dashboard.module.css";

function Dashboard() {
  const { utilisateur } = useAuth();
  return (
    <div>
      <h1 className={styles.titre}>
        Bonjour, {utilisateur?.first_name || utilisateur?.username}
      </h1>
      <p className={styles.sousTitre}>Connecté en tant que {utilisateur?.role_display}</p>
    </div>
  );
}

export default Dashboard;