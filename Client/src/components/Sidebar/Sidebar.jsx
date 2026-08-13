import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MENU_PAR_ROLE, ITEMS_MENU, ENTREPRISE } from "../../config/config";
import styles from "../../theme/components/Sidebar.module.css";

function Sidebar() {
  const { utilisateur, deconnecter } = useAuth();
  const cles = MENU_PAR_ROLE[utilisateur?.role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} className={styles.logo} />
        <div>
          <p className={styles.nom}>{ENTREPRISE.nomCourt}</p>
          <p className={styles.sousTitre}>Hajj & Oumra — Conakry</p>
        </div>
      </div>

      <nav className={styles.menu}>
        {cles.map((cle) => {
          const item = ITEMS_MENU[cle];
          if (!item) return null;
          return (
            <NavLink
              key={cle}
              to={item.path}
              className={({ isActive }) => (isActive ? `${styles.lien} ${styles.lienActif}` : styles.lien)}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.pied}>
        <p className={styles.nomUtilisateur}>{utilisateur?.first_name} {utilisateur?.last_name}</p>
        <p className={styles.role}>{utilisateur?.role_display}</p>
        <button onClick={deconnecter} className={styles.boutonDeconnexion}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;