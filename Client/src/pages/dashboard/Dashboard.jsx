import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import styles from "../../theme/pages/dashboard/Dashboard.module.css";

function Dashboard() {
  const { utilisateur } = useAuth();
  const { t } = useTranslation();
  return (
    <div>
      <h1 className={styles.titre}>
        {t("bonjour")}, {utilisateur?.first_name || utilisateur?.username}
      </h1>
      <p className={styles.sousTitre}>{t("connecte_en_tant_que")} {utilisateur?.role_display}</p>
    </div>
  );
}

export default Dashboard;