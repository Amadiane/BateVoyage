import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TrendingDown, TrendingUp, Wallet2,
  PiggyBank, Users, UserCheck,
  UserX, UserPlus, ArrowUpRight,
} from "lucide-react";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

const BOUTONS = [
  {
    cle: "decaissement",
    label: "decaissements",
    categorie: "section_tresorerie",
    icone: TrendingDown,
    couleur: "#2B6CE0",
    couleurFoncee: "#163E85",
    taille: "grand",
  },
  {
    cle: "encaissement",
    label: "encaissements",
    categorie: "section_tresorerie",
    icone: TrendingUp,
    couleur: "#2B6CE0",
    couleurFoncee: "#163E85",
    taille: "normal",
  },
  {
    cle: "budget-fonctionnement",
    label: "budget_fonctionnement",
    categorie: "section_tresorerie",
    icone: Wallet2,
    couleur: "#2B6CE0",
    couleurFoncee: "#163E85",
    taille: "normal",
  },
  {
    cle: "benefice-individuel",
    label: "benefice_individuel",
    categorie: "section_rentabilite",
    icone: Users,
    couleur: "#C7A44A",
    couleurFoncee: "#8A6C1F",
    taille: "normal",
  },
  {
    cle: "benefice-pelerin",
    label: "benefice_pelerin",
    categorie: "section_rentabilite",
    icone: UserCheck,
    couleur: "#C7A44A",
    couleurFoncee: "#8A6C1F",
    taille: "normal",
  },
  {
    cle: "benefice-global",
    label: "benefice_global",
    categorie: "section_rentabilite",
    icone: PiggyBank,
    couleur: "#C7A44A",
    couleurFoncee: "#8A6C1F",
    taille: "large",
  },
  {
    cle: "dette",
    label: "dette",
    categorie: "section_dettes_creances",
    icone: UserX,
    couleur: "#D64A8A",
    couleurFoncee: "#96285C",
    taille: "normal",
  },
  {
    cle: "creance",
    label: "creance",
    categorie: "section_dettes_creances",
    icone: UserPlus,
    couleur: "#D64A8A",
    couleurFoncee: "#96285C",
    taille: "normal",
  },
];

const CLASSE_TAILLE = {
  grand: "tuileGrande",
  large: "tuileLarge",
  normal: "",
};

function PageComptabilite({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {basePath && (
        <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>
      )}

      <h1 className={styles.titre}>{t("menu_comptabilite")}</h1>
      <p className={styles.sousTitre}>{t("comptabilite_description")}</p>

      <div className={styles.bento}>
        {BOUTONS.map((b) => {
          const Icone = b.icone;
          const pleine = b.taille === "grand" || b.taille === "large";
          return (
            <button
              key={b.cle}
              className={`${styles.tuile} ${styles[CLASSE_TAILLE[b.taille]] || ""} ${pleine ? styles.tuilePleine : styles.tuileLegere}`}
              style={
                pleine
                  ? { background: `linear-gradient(145deg, ${b.couleur}, ${b.couleurFoncee})` }
                  : { background: `linear-gradient(160deg, ${b.couleur}17, ${b.couleur}06 65%)`, borderColor: `${b.couleur}2E` }
              }
              onClick={() => navigate(`${basePath}/finances/${b.cle}`)}
            >
              <Icone
                className={styles.iconeFantome}
                strokeWidth={1.3}
                style={{ color: pleine ? "#fff" : b.couleur }}
              />

              <span
                className={styles.categorieTuile}
                style={{ color: pleine ? "rgba(255,255,255,0.85)" : b.couleur }}
              >
                {t(b.categorie)}
              </span>

              <div className={styles.basTuile}>
                <div
                  className={styles.iconeRonde}
                  style={{ backgroundColor: pleine ? "rgba(255,255,255,0.2)" : b.couleur }}
                >
                  <Icone size={17} color="#fff" strokeWidth={2} />
                </div>
                <span className={styles.libelleTuile} style={{ color: pleine ? "#fff" : "#10151F" }}>
                  {t(b.label)}
                </span>
                <ArrowUpRight
                  size={17}
                  className={styles.flecheTuile}
                  style={{ color: pleine ? "#fff" : b.couleur }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageComptabilite;