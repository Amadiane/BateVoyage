import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "../theme/layouts/DashboardLayout.module.css";

function DashboardLayout() {
  return (
    <div className={styles.conteneur}>
      <Sidebar />
      <main className={styles.contenu}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;