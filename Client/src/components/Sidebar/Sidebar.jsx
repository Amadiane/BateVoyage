import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Ticket, Car, Package, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MENU_PAR_ROLE, ITEMS_MENU, ENTREPRISE } from "../../config/config";
import { configurationService } from "../../services/configurationService";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import styles from "../../theme/components/Sidebar.module.css";

const ROLES_VOIENT_MODULES_FUTURS = ["fondateur", "admin_general"];

function Sidebar({ ouverte, onFermer }) {
  const { t } = useTranslation();
  const { utilisateur, deconnecter } = useAuth();
  const [clesActives, setClesActives] = useState(null);

  const chargerModulesActifs = () => {
  configurationService.listerModules().then(({ data }) => {
    setClesActives(new Set(data.filter((m) => m.actif).map((m) => m.cle)));
  }).catch(() => {
    setClesActives(null);
  });
};

useEffect(() => {
  chargerModulesActifs();
  window.addEventListener("modules-systeme-modifies", chargerModulesActifs);
  return () => window.removeEventListener("modules-systeme-modifies", chargerModulesActifs);
}, []);

  const clesRole = MENU_PAR_ROLE[utilisateur?.role] || [];
  // "dashboard" reste toujours visible, quel que soit l'état des modules.
const CLES_TOUJOURS_VISIBLES = ["dashboard", "modules_visibles"];

const clesAffichees = clesActives
  ? clesRole.filter((cle) => CLES_TOUJOURS_VISIBLES.includes(cle) || clesActives.has(cle))
  : clesRole;

  const voitModulesFuturs = ROLES_VOIENT_MODULES_FUTURS.includes(utilisateur?.role);

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

        {voitModulesFuturs && (
          <div className={styles.sectionFuture}>
            <p className={styles.titreSectionFuture}>{t("modules_a_venir_titre")}</p>
            <div className={styles.lienDesactive}>
              <Ticket size={17} className={styles.iconeLien} />
              {t("billetterie")}
              <span className={styles.badgeBientot}>{t("bientot")}</span>
            </div>
            <div className={styles.lienDesactive}>
              <Car size={17} className={styles.iconeLien} />
              {t("location")}
              <span className={styles.badgeBientot}>{t("bientot")}</span>
            </div>
            <div className={styles.lienDesactive}>
              <Package size={17} className={styles.iconeLien} />
              {t("import_export")}
              <span className={styles.badgeBientot}>{t("bientot")}</span>
            </div>
          </div>
        )}
      </nav>

      <div className={styles.zoneLangue}>
        <LanguageSwitcher variant="sombre" />
      </div>


    </aside>
  );
}

export default Sidebar;