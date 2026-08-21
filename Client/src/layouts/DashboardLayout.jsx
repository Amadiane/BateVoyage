import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "../theme/layouts/DashboardLayout.module.css";

function DashboardLayout() {
  const [sidebarOuverte, setSidebarOuverte] = useState(false);

  return (
    <div className={styles.conteneur}>
      <button className={styles.boutonMenuMobile} onClick={() => setSidebarOuverte(true)}>
        <Menu size={20} />
      </button>

      <Sidebar ouverte={sidebarOuverte} onFermer={() => setSidebarOuverte(false)} />

      {sidebarOuverte && (
        <div className={styles.voile} onClick={() => setSidebarOuverte(false)} />
      )}

      <main className={styles.contenu}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;