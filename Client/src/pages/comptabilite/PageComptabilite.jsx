import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wallet, Receipt, TrendingDown, TrendingUp, Building2, Wallet2,
  PiggyBank, UserX, Users, UserCheck, UserPlus, FileText, ArrowRight,
} from "lucide-react";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

const SECTIONS = [
  {
    cle: "tresorerie",
    couleur: "#2B6CE0",
    boutons: [
      { cle: "decaissement", label: "decaissements", icone: TrendingDown },
      { cle: "encaissement", label: "encaissements", icone: TrendingUp },
      { cle: "budget-fonctionnement", label: "budget_fonctionnement", icone: Wallet2 },
    ],
  },
  {
    cle: "rentabilite",
    couleur: "#C7A44A",
    boutons: [
      { cle: "benefice-global", label: "benefice_global", icone: PiggyBank },
      { cle: "benefice-individuel", label: "benefice_individuel", icone: Users },
      { cle: "benefice-pelerin", label: "benefice_pelerin", icone: UserCheck },
    ],
  },
  {
    cle: "dettes_creances",
    couleur: "#D64A8A",
    boutons: [
      { cle: "dette", label: "dette", icone: UserX },
      { cle: "creance", label: "creance", icone: UserPlus },
      { cle: "dettes", label: "dettes_fournisseurs", icone: Building2 },
    ],
  },
  {
    cle: "documents_suivi",
    couleur: "#2F9E5C",
    boutons: [
      { cle: "bons-sortie", label: "bons_sortie", icone: Receipt },
      { cle: "depenses", label: "depenses", icone: Wallet },
      { cle: "devis-facture", label: "devis_facture", icone: FileText },
    ],
  },
];

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

      {SECTIONS.map((section) => (
        <div key={section.cle} className={styles.section}>
          <div className={styles.enteteSection}>
            <span className={styles.puceSection} style={{ backgroundColor: section.couleur }} />
            <h2 className={styles.titreSection}>{t(`section_${section.cle}`)}</h2>
          </div>
          <div className={styles.grilleBoutons}>
            {section.boutons.map((b) => {
              const Icone = b.icone;
              return (
                <button
                  key={b.cle}
                  className={styles.carteBouton}
                  onClick={() => navigate(`${basePath}/finances/${b.cle}`)}
                >
                  <div className={styles.iconeCercle} style={{ backgroundColor: `${section.couleur}18`, color: section.couleur }}>
                    <Icone size={19} />
                  </div>
                  <span className={styles.libelleBouton}>{t(b.label)}</span>
                  <ArrowRight size={15} className={styles.flecheBouton} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PageComptabilite;