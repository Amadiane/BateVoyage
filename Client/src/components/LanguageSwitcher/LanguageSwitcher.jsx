import { useTranslation } from "react-i18next";
import styles from "../../theme/components/LanguageSwitcher.module.css";

const LANGUES = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "ع" },
  { code: "en", label: "EN" },
];

function LanguageSwitcher({ variant = "clair" }) {
  const { i18n } = useTranslation();

  return (
    <div className={`${styles.conteneur} ${variant === "sombre" ? styles.sombre : ""}`}>
      {LANGUES.map((langue) => (
        <button
          key={langue.code}
          type="button"
          onClick={() => i18n.changeLanguage(langue.code)}
          className={`${styles.bouton} ${i18n.language === langue.code ? styles.actif : ""}`}
        >
          {langue.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;