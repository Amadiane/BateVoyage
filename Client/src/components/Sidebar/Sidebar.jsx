import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { MENU_PAR_ROLE, ITEMS_MENU, ENTREPRISE } from "../../config/config";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import styles from "../../theme/components/Sidebar.module.css";

function Sidebar() {
  const { t } = useTranslation();
  const { utilisateur, deconnecter } = useAuth();
  const cles = MENU_PAR_ROLE[utilisateur?.role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} className={styles.logo} />
        <div>
          <p className={styles.nom}>{ENTREPRISE.nomCourt}</p>
          <p className={styles.sousTitre}>Hajj & Omra Management</p>
        </div>
      </div>

      <nav className={styles.menu}>
        {cles.map((cle) => {
          const item = ITEMS_MENU[cle];
          if (!item) return null;
          const Icone = item.icone;
          return (
            <NavLink
              key={cle}
              to={item.path}
              className={({ isActive }) => (isActive ? `${styles.lien} ${styles.lienActif}` : styles.lien)}
            >
              {Icone && <Icone size={17} className={styles.iconeLien} />}
              {t(item.cle)}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.assistance}>
        <p className={styles.assistanceTitre}>📞 {t("assistance_24_7")}</p>
        <p className={styles.assistanceNumero}>{ENTREPRISE.telephones[0]}</p>
      </div>

      <div className={styles.zoneLangue}>
        <LanguageSwitcher variant="sombre" />
      </div>

      <div className={styles.pied}>
        <p className={styles.nomUtilisateur}>{utilisateur?.first_name} {utilisateur?.last_name}</p>
        <p className={styles.role}>{utilisateur?.role_display}</p>
        <button onClick={deconnecter} className={styles.boutonDeconnexion}>
          {t("se_deconnecter")}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;