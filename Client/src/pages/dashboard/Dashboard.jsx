import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { pelerinService } from "../../services/pelerinService";
import { documentService } from "../../services/documentService";
import styles from "../../theme/pages/dashboard/Dashboard.module.css";

const COULEURS_STATUT = {
  inscrit: "#9CA3AF",
  en_preparation: "#F59E0B",
  valide: "#0B3FA0",
  en_voyage: "#2B6CE0",
  retourne: "#10B981",
  cloture: "#6B7280",
};

function Dashboard() {
  const { t } = useTranslation();
  const { utilisateur } = useAuth();
  const [pelerins, setPelerins] = useState([]);
  const [docs, setDocs] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([pelerinService.lister(), documentService.obtenirTableauBord()]).then(
      ([resPelerins, resDocs]) => {
        setPelerins(resPelerins.data);
        setDocs(resDocs.data);
        setChargement(false);
      }
    );
  }, []);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  const repartition = Object.entries(
    pelerins.reduce((acc, p) => {
      acc[p.statut] = (acc[p.statut] || 0) + 1;
      return acc;
    }, {})
  ).map(([statut, valeur]) => ({ statut, valeur }));

  const montantTotal = pelerins.reduce((s, p) => s + parseFloat(p.montant_verse || 0), 0);

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("bienvenue")}, {utilisateur?.first_name || utilisateur?.username}</h1>
          <p className={styles.sousTitre}>{t("connecte_en_tant_que")} {utilisateur?.role_display}</p>
        </div>
      </div>

      <div className={styles.cartesStat}>
        <CarteStat chiffre={pelerins.length} label={t("total_pelerins")} couleur="brand" />
        <CarteStat chiffre={docs?.total_dossiers_incomplets ?? 0} label={t("dossiers_incomplets")} couleur="avertissement" />
        <CarteStat chiffre={docs?.visas_en_attente?.length ?? 0} label={t("visas_en_attente")} couleur="or" />
        <CarteStat chiffre={`${montantTotal.toLocaleString("fr-FR")} GNF`} label={t("montant_total_verse")} couleur="succes" />
      </div>

      <div className={styles.grillePrincipale}>
        <div className={styles.cartePrincipale}>
          <h2 className={styles.titreCarte}>{t("repartition_statuts")}</h2>
          {repartition.length === 0 ? (
            <p className={styles.etatVide}>{t("aucun_pelerin")}</p>
          ) : (
            <div className={styles.zoneGraphique}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={repartition} dataKey="valeur" nameKey="statut" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {repartition.map((entry) => (
                      <Cell key={entry.statut} fill={COULEURS_STATUT[entry.statut] || "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legende}>
                {repartition.map((entry) => (
                  <div key={entry.statut} className={styles.itemLegende}>
                    <span className={styles.pucelegende} style={{ backgroundColor: COULEURS_STATUT[entry.statut] || "#9CA3AF" }} />
                    {t(`statut_${entry.statut}`)} ({entry.valeur})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.cartePrincipale}>
          <h2 className={styles.titreCarte}>{t("modules_a_venir")}</h2>
          <div className={styles.badgesAVenir}>
            {["Hajj", "Omra", "Vols", "Hôtels", "Transport", "Rapports"].map((m) => (
              <span key={m} className={styles.badgeAVenir}>{m}</span>
            ))}
          </div>
          <p className={styles.texteAVenir}>{t("modules_a_venir_description")}</p>
        </div>
      </div>
    </div>
  );
}

function CarteStat({ chiffre, label, couleur }) {
  return (
    <div className={`${styles.carteStat} ${styles["carte_" + couleur]}`}>
      <p className={styles.chiffreStat}>{chiffre}</p>
      <p className={styles.labelStat}>{label}</p>
    </div>
  );
}

export default Dashboard;