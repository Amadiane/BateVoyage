import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet, Receipt, TrendingDown, TrendingUp, Building2, Wallet2, PiggyBank, UserX, Users, UserCheck, UserPlus, FileText } from "lucide-react";
import styles from "../../theme/pages/comptabilite/PageComptabilite.module.css";

function PageComptabilite({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const boutons = [
    { cle: "decaissement", label: t("decaissements"), icone: TrendingDown, couleur: "rouge" },
    { cle: "encaissement", label: t("encaissements"), icone: TrendingUp, couleur: "vert" },
    { cle: "frais-personnels", label: t("budget_fonctionnement"), icone: Wallet2, couleur: "cyan" },
    { cle: "benefice-global", label: t("benefice_global"), icone: PiggyBank, couleur: "or" },
    { cle: "benefice-individuel", label: t("benefice_individuel"), icone: Users, couleur: "violet" },
    { cle: "benefice-pelerin", label: t("benefice_pelerin"), icone: UserCheck, couleur: "cyan" },
    { cle: "dette", label: t("dette"), icone: UserX, couleur: "rose" },
    { cle: "creance", label: t("creance"), icone: UserPlus, couleur: "vert" },
    { cle: "devis-facture", label: t("devis_facture"), icone: FileText, couleur: "or" },
    { cle: "bons-sortie", label: t("bons_sortie"), icone: Receipt, couleur: "orange" },
    { cle: "depenses", label: t("depenses"), icone: Wallet, couleur: "violet" },
    { cle: "dettes", label: t("dettes_fournisseurs"), icone: Building2, couleur: "bleu" },
  ];

  return (
    <div>
      {basePath && (
        <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>
      )}

      <h1 className={styles.titre}>{t("menu_comptabilite")}</h1>
      <p className={styles.sousTitre}>{t("comptabilite_description")}</p>

      <div className={styles.grilleBoutons}>
        {boutons.map((b) => {
          const Icone = b.icone;
          return (
            <button
              key={b.cle}
              className={`${styles.carteBouton} ${styles["bordure_" + b.couleur]}`}
              onClick={() => navigate(`${basePath}/finances/${b.cle}`)}
            >
              <div className={`${styles.iconeCercle} ${styles["cercle_" + b.couleur]}`}>
                <Icone size={26} />
              </div>
              <span className={styles.libelleBouton}>{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageComptabilite;