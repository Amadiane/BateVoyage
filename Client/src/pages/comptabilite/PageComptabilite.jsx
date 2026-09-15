import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Wallet, Receipt, TrendingDown, TrendingUp, Building2, Home,
  PiggyBank, UserX, Users, UserCheck, UserPlus, FileText,
} from "lucide-react";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

const SECTIONS = [
  {
    titre: "tresorerie",
    boutons: [
      { cle: "decaissement", label: "decaissements", icone: TrendingDown },
      { cle: "encaissement", label: "encaissements", icone: TrendingUp },
      { cle: "frais-personnels", label: "frais_personnels", icone: Home },
    ],
  },
  {
    titre: "rentabilite",
    boutons: [
      { cle: "benefice-global", label: "benefice_global", icone: PiggyBank },
      { cle: "benefice-individuel", label: "benefice_individuel", icone: Users },
      { cle: "benefice-pelerin", label: "benefice_pelerin", icone: UserCheck },
    ],
  },
  {
    titre: "dettes_creances",
    boutons: [
      { cle: "dette", label: "dette", icone: UserX },
      { cle: "creance", label: "creance", icone: UserPlus },
      { cle: "dettes", label: "dettes_fournisseurs", icone: Building2 },
    ],
  },
  {
    titre: "documents_suivi",
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
        <div key={section.titre} className={styles.section}>
          <div className={styles.enteteSection}>
            <span className={styles.railleSection} />
            <h2 className={styles.titreSection}>{t(`section_${section.titre}`)}</h2>
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
                  <Icone size={20} className={styles.iconeBouton} />
                  <span className={styles.libelleBouton}>{t(b.label)}</span>
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