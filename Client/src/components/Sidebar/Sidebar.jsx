import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MENU_PAR_ROLE, ITEMS_MENU, ENTREPRISE } from "../../config/config";
import { configurationService } from "../../services/configurationService";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import styles from "../../theme/components/Sidebar.module.css";

// "dashboard" et "modules_visibles" restent toujours visibles, quel que soit l'état des modules.
const CLES_TOUJOURS_VISIBLES = ["dashboard", "modules_visibles"];

function Sidebar({ ouverte, onFermer }) {
  const { t } = useTranslation();
  const { utilisateur, deconnecter } = useAuth();
  const [clesActives, setClesActives] = useState(null);

  const chargerModulesActifs = () => {
    configurationService
      .listerModules()
      .then(({ data }) => {
        setClesActives(new Set(data.filter((m) => m.actif).map((m) => m.cle)));
      })
      .catch(() => {
        setClesActives(null);
      });
  };

  useEffect(() => {
    chargerModulesActifs();
    window.addEventListener("modules-systeme-modifies", chargerModulesActifs);
    return () => window.removeEventListener("modules-systeme-modifies", chargerModulesActifs);
  }, []);

  const clesRole = MENU_PAR_ROLE[utilisateur?.role] || [];
  const clesAffichees = clesActives
    ? clesRole.filter((cle) => CLES_TOUJOURS_VISIBLES.includes(cle) || clesActives.has(cle))
    : clesRole;

  const nomComplet = [utilisateur?.first_name, utilisateur?.last_name].filter(Boolean).join(" ") || utilisateur?.username;
  const initiales = `${utilisateur?.first_name?.[0] || ""}${utilisateur?.last_name?.[0] || utilisateur?.username?.[0] || ""}`.toUpperCase();

  return (
    <aside className={`${styles.sidebar} ${ouverte ? styles.sidebarOuverte : ""}`}>
      <button className={styles.boutonFermerMobile} onClick={onFermer}>
        <X size={18} />
      </button>

      <div className={styles.blocLogo}>
        <img src={ENTREPRISE.logo} alt={ENTREPRISE.nomCourt} className={styles.logo} />
        <p className={styles.nomMarque}>{ENTREPRISE.nomComplet}</p>
        <p className={styles.sousTitreMarque}>HAJJ & OMRA MANAGEMENT SYSTEM</p>
      </div>

      <nav className={styles.menu}>
        {clesAffichees.map((cle) => {
          const item = ITEMS_MENU[cle];
          if (!item) return null;
          const Icone = item.icone;
          return (
            <NavLink
              key={cle}
              to={item.path}
              onClick={onFermer}
              className={({ isActive }) => (isActive ? `${styles.lien} ${styles.lienActif}` : styles.lien)}
            >
              {Icone && <Icone size={17} className={styles.iconeLien} />}
              {t(item.cle)}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.zoneLangue}>
        <LanguageSwitcher variant="sombre" />
      </div>

      {/* Utilisateur connecté + déconnexion */}
      <div className={styles.pied}>
        <div className={styles.carteUtilisateur}>
          <div className={styles.avatarUtilisateur}>
            {utilisateur?.photo ? (
              <img src={utilisateur.photo} alt="" className={styles.photoUtilisateur} />
            ) : (
              initiales || <User size={16} />
            )}
          </div>
          <div className={styles.infosUtilisateur}>
            <p className={styles.nomUtilisateur}>{nomComplet}</p>
            <p className={styles.role}>{utilisateur?.role_display}</p>
          </div>
        </div>

        <button className={styles.boutonDeconnexion} onClick={deconnecter}>
          <LogOut size={15} />
          {t("se_deconnecter")}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;