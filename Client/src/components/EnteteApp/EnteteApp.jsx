import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import styles from "../../theme/components/EnteteApp.module.css";

function EnteteApp() {
  const { t, i18n } = useTranslation();
  const { utilisateur, deconnecter } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function fermerSiExterieur(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  const dateAujourdhui = new Date().toLocaleDateString(
    i18n.language === "ar" ? "ar-SA" : i18n.language === "en" ? "en-US" : "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const initiales = `${utilisateur?.first_name?.[0] || ""}${utilisateur?.last_name?.[0] || utilisateur?.username?.[0] || ""}`.toUpperCase();

  return (
    <div className={styles.entete}>
      <div className={styles.zoneDate}>
        <span className={styles.date}>{dateAujourdhui}</span>
      </div>

      <div className={styles.zoneDroite}>
        <button className={styles.boutonNotification}>
          <Bell size={18} />
        </button>

        <div className={styles.menuProfil} ref={menuRef}>
          <button className={styles.boutonProfil} onClick={() => setMenuOuvert((v) => !v)}>
            {utilisateur?.photo ? (
              <img src={utilisateur.photo} alt="" className={styles.photoProfil} />
            ) : (
              <div className={styles.avatarInitiales}>{initiales || <User size={16} />}</div>
            )}
            <div className={styles.infosProfil}>
              <span className={styles.nomProfil}>{utilisateur?.first_name || utilisateur?.username}</span>
              <span className={styles.roleProfil}>{utilisateur?.role_display}</span>
            </div>
            <ChevronDown size={15} className={`${styles.chevron} ${menuOuvert ? styles.chevronOuvert : ""}`} />
          </button>

          {menuOuvert && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownEntete}>
                <p className={styles.dropdownNom}>{utilisateur?.first_name} {utilisateur?.last_name}</p>
                <p className={styles.dropdownRole}>{utilisateur?.role_display}</p>
              </div>
              <button className={styles.dropdownDeconnexion} onClick={deconnecter}>
                <LogOut size={15} /> {t("se_deconnecter")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnteteApp;