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
    taille: "grand",
  },
  {
    cle: "encaissement",
    label: "encaissements",
    categorie: "section_tresorerie",
    icone: TrendingUp,
    couleur: "#2B6CE0",
    taille: "normal",
  },
  {
    cle: "budget-fonctionnement",
    label: "budget_fonctionnement",
    categorie: "section_tresorerie",
    icone: Wallet2,
    couleur: "#2B6CE0",
    taille: "normal",
  },
  {
    cle: "benefice-individuel",
    label: "benefice_individuel",
    categorie: "section_rentabilite",
    icone: Users,
    couleur: "#C7A44A",
    taille: "normal",
  },
  {
    cle: "benefice-pelerin",
    label: "benefice_pelerin",
    categorie: "section_rentabilite",
    icone: UserCheck,
    couleur: "#C7A44A",
    taille: "normal",
  },
  {
    cle: "benefice-global",
    label: "benefice_global",
    categorie: "section_rentabilite",
    icone: PiggyBank,
    couleur: "#C7A44A",
    taille: "large",
  },
  {
    cle: "dette",
    label: "dette",
    categorie: "section_dettes_creances",
    icone: UserX,
    couleur: "#D64A8A",
    taille: "normal",
  },
  {
    cle: "creance",
    label: "creance",
    categorie: "section_dettes_creances",
    icone: UserPlus,
    couleur: "#D64A8A",
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
          return (
            <button
              key={b.cle}
              className={`${styles.tuile} ${styles[CLASSE_TAILLE[b.taille]] || ""}`}
              style={{
                "--couleur": b.couleur,
                background: `linear-gradient(155deg, ${b.couleur}14, ${b.couleur}05 60%)`,
                borderColor: `${b.couleur}26`,
              }}
              onClick={() => navigate(`${basePath}/finances/${b.cle}`)}
            >
              <Icone className={styles.iconeFantome} strokeWidth={1.4} />

              <span className={styles.categorieTuile} style={{ color: b.couleur }}>
                {t(b.categorie)}
              </span>

              <div className={styles.basTuile}>
                <div className={styles.iconeRonde} style={{ backgroundColor: b.couleur }}>
                  <Icone size={17} color="#fff" strokeWidth={2} />
                </div>
                <span className={styles.libelleTuile}>{t(b.label)}</span>
                <ArrowUpRight size={17} className={styles.flecheTuile} style={{ color: b.couleur }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageComptabilite;