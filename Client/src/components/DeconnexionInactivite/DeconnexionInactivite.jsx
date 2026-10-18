import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

// ---- Réglages ----
const DELAI_INACTIVITE_MIN = 15;     // déconnexion après 15 minutes sans activité
const DELAI_AVERTISSEMENT_SEC = 60;  // avertissement pendant la dernière minute

const DELAI_MS = DELAI_INACTIVITE_MIN * 60 * 1000;
const AVERTISSEMENT_MS = DELAI_AVERTISSEMENT_SEC * 1000;
const CLE_ACTIVITE = "bvg_derniere_activite"; // partagée entre les onglets
const EVENEMENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

const lireActivite = () => {
  try { return parseInt(localStorage.getItem(CLE_ACTIVITE) || "0", 10) || 0; } catch { return 0; }
};
const ecrireActivite = (v) => {
  try { localStorage.setItem(CLE_ACTIVITE, String(v)); } catch { /* ignoré */ }
};

// Dernier recours si le contexte d'authentification n'expose pas de fonction de déconnexion.
const nettoyerSession = () => {
  [localStorage, sessionStorage].forEach((store) => {
    try {
      Object.keys(store)
        .filter((k) => /token|jwt|access|refresh|auth/i.test(k))
        .forEach((k) => store.removeItem(k));
    } catch { /* ignoré */ }
  });
};

function DeconnexionInactivite() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth() || {};

  const derniereActivite = useRef(Date.now());
  const avertissementOuvert = useRef(false);
  const deconnexionEnCours = useRef(false);
  const [secondesRestantes, setSecondesRestantes] = useState(null);

  const quitter = async () => {
    if (deconnexionEnCours.current) return;
    deconnexionEnCours.current = true;
    try {
      if (typeof auth.deconnecter === "function") await auth.deconnecter();
      else if (typeof auth.logout === "function") await auth.logout();
      else nettoyerSession();
    } catch {
      nettoyerSession();
    }
    navigate("/login", { replace: true, state: { inactivite: true } });
  };

  const resterConnecte = () => {
    const maintenant = Date.now();
    derniereActivite.current = maintenant;
    ecrireActivite(maintenant);
    avertissementOuvert.current = false;
    setSecondesRestantes(null);
  };

  useEffect(() => {
    const maintenant = Date.now();
    derniereActivite.current = maintenant;
    ecrireActivite(maintenant);

    // Activité de l'utilisateur (ignorée pendant l'avertissement : il faut cliquer sur le bouton)
    const surActivite = () => {
      if (avertissementOuvert.current) return;
      const n = Date.now();
      if (n - derniereActivite.current > 2000) {   // on limite les écritures
        derniereActivite.current = n;
        ecrireActivite(n);
      }
    };
    EVENEMENTS.forEach((e) => window.addEventListener(e, surActivite, { passive: true }));

    // Activité détectée dans un autre onglet
    const surStockage = (e) => {
      if (e.key === CLE_ACTIVITE && e.newValue) {
        const v = parseInt(e.newValue, 10) || 0;
        if (v > derniereActivite.current) derniereActivite.current = v;
      }
    };
    window.addEventListener("storage", surStockage);

    // Vérification chaque seconde (basée sur l'heure réelle : fiable même après une mise en veille)
    const minuteur = setInterval(() => {
      const derniere = Math.max(derniereActivite.current, lireActivite());
      const inactif = Date.now() - derniere;

      if (inactif >= DELAI_MS) {
        clearInterval(minuteur);
        quitter();
      } else if (inactif >= DELAI_MS - AVERTISSEMENT_MS) {
        avertissementOuvert.current = true;
        setSecondesRestantes(Math.ceil((DELAI_MS - inactif) / 1000));
      } else if (avertissementOuvert.current) {
        // activité détectée dans un autre onglet pendant l'avertissement
        avertissementOuvert.current = false;
        setSecondesRestantes(null);
      }
    }, 1000);

    return () => {
      clearInterval(minuteur);
      EVENEMENTS.forEach((e) => window.removeEventListener(e, surActivite));
      window.removeEventListener("storage", surStockage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (secondesRestantes === null) return null;

  return (
    <div style={styles.superposition} role="alertdialog" aria-modal="true">
      <div style={styles.boite}>
        <div style={styles.icone}>⏳</div>
        <h2 style={styles.titre}>{t("inactivite_titre", "Toujours là ?")}</h2>
        <p style={styles.texte}>
          {t("inactivite_message", "Sans activité, vous serez déconnecté dans")}{" "}
          <strong>{secondesRestantes} s</strong>.
        </p>
        <div style={styles.actions}>
          <button type="button" style={styles.boutonSecondaire} onClick={quitter}>
            {t("se_deconnecter", "Se déconnecter")}
          </button>
          <button type="button" style={styles.boutonPrincipal} onClick={resterConnecte} autoFocus>
            {t("rester_connecte", "Rester connecté")}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  superposition: {
    position: "fixed", inset: 0, background: "rgba(16, 21, 31, 0.6)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  boite: {
    background: "#fff", borderRadius: 16, padding: "24px 22px", width: "100%", maxWidth: 380,
    textAlign: "center", boxShadow: "0 20px 50px rgba(16, 21, 31, 0.3)",
  },
  icone: { fontSize: 34, marginBottom: 6 },
  titre: { margin: "0 0 8px", fontSize: 18, color: "#10151F" },
  texte: { margin: "0 0 18px", fontSize: 14, color: "#4B5563" },
  actions: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  boutonPrincipal: {
    padding: "10px 16px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13.5,
    color: "#fff", background: "linear-gradient(135deg, #10151F, #0B3FA0)",
  },
  boutonSecondaire: {
    padding: "10px 16px", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13.5,
    color: "#374151", background: "#F3F4F6", border: "1px solid #E5E7EB",
  },
};

export default DeconnexionInactivite;