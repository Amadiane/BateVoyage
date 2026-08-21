import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, FileWarning, Clock, Wallet, MessageSquareWarning, Plane, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { pelerinService } from "../../services/pelerinService";
import { documentService } from "../../services/documentService";
import { reclamationService } from "../../services/reclamationService";
import { groupeService } from "../../services/groupeService";
import { hotelService } from "../../services/hotelService";
import { paiementService } from "../../services/paiementService";
import imageKaaba from "../../assets/images/kaaba.jpg";
import styles from "../../theme/pages/dashboard/Dashboard.module.css";

const COULEURS_STATUT = {
  inscrit: "#9CA3AF",
  en_preparation: "#F59E0B",
  valide: "#0B3FA0",
  en_voyage: "#2B6CE0",
  retourne: "#10B981",
  cloture: "#6B7280",
};

const ROLES_VOIENT_FINANCES = ["fondateur", "admin_general", "comptable", "secretaire"];
const ROLES_VOIENT_RECLAMATIONS = ["fondateur", "admin_general", "affaires_sociales"];
const ROLES_VOIENT_LOGISTIQUE = ["fondateur", "admin_general", "secretaire", "guide", "encadreur", "mounazim"];

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();
  const [pelerins, setPelerins] = useState([]);
  const [docs, setDocs] = useState(null);
  const [reclamationsOuvertes, setReclamationsOuvertes] = useState(0);
  const [groupes, setGroupes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [resumeFinancier, setResumeFinancier] = useState(null);
  const [chargement, setChargement] = useState(true);

  const peutVoirFinances = ROLES_VOIENT_FINANCES.includes(utilisateur?.role);
  const peutVoirReclamations = ROLES_VOIENT_RECLAMATIONS.includes(utilisateur?.role);
  const peutVoirLogistique = ROLES_VOIENT_LOGISTIQUE.includes(utilisateur?.role);

  useEffect(() => {
    const requetes = [pelerinService.lister()];
    if (peutVoirFinances) {
      requetes.push(documentService.obtenirTableauBord());
      requetes.push(paiementService.obtenirResumeFinancier());
    }
    if (peutVoirReclamations) requetes.push(reclamationService.lister({ statut: "nouvelle" }));
    if (peutVoirLogistique) {
      requetes.push(groupeService.lister());
      requetes.push(hotelService.lister());
    }

    Promise.all(requetes).then((resultats) => {
      let i = 0;
      setPelerins(resultats[i++].data);
      if (peutVoirFinances) {
        setDocs(resultats[i++].data);
        setResumeFinancier(resultats[i++].data);
      }
      if (peutVoirReclamations) setReclamationsOuvertes(resultats[i++].data.length);
      if (peutVoirLogistique) {
        setGroupes(resultats[i++].data);
        setHotels(resultats[i++].data);
      }
      setChargement(false);
    });
  }, []);

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  const repartition = Object.entries(
    pelerins.reduce((acc, p) => {
      acc[p.statut] = (acc[p.statut] || 0) + 1;
      return acc;
    }, {})
  ).map(([statut, valeur]) => ({ statut, valeur }));

  const montantTotal = peutVoirFinances
    ? pelerins.reduce((s, p) => s + parseFloat(p.montant_total_verse || 0), 0)
    : null;

  const aujourdhui = new Date();
  const prochainsDeparts = groupes
    .filter((g) => g.vol_aller_detail && new Date(g.vol_aller_detail.date_vol) >= aujourdhui)
    .sort((a, b) => new Date(a.vol_aller_detail.date_vol) - new Date(b.vol_aller_detail.date_vol))
    .slice(0, 4);

  return (
    <div>
      {/* ---------- Bandeau de bienvenue ---------- */}
      <div className={styles.hero} style={{ backgroundImage: `url(${imageKaaba})` }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContenu}>
          <p className={styles.heroVerset}>وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ</p>
          <h1 className={styles.heroTitre}>{t("bienvenue")}, {utilisateur?.first_name || utilisateur?.username}</h1>
          <p className={styles.heroSousTitre}>{t("connecte_en_tant_que")} {utilisateur?.role_display}</p>
        </div>
      </div>

      {/* ---------- Cartes statistiques (cliquables) ---------- */}
      <div className={styles.cartesStat}>
        <CarteStat
          icone={Users}
          chiffre={pelerins.length}
          label={t("total_pelerins")}
          couleur="bleu"
          onClick={() => navigate("/pelerins")}
        />

        {peutVoirFinances && (
          <>
            <CarteStat
              icone={FileWarning}
              chiffre={docs?.total_dossiers_incomplets ?? 0}
              label={t("dossiers_incomplets")}
              couleur="orange"
              onClick={() => navigate("/documents")}
            />
            <CarteStat
              icone={Clock}
              chiffre={docs?.visas_en_attente?.length ?? 0}
              label={t("visas_en_attente")}
              couleur="or"
              onClick={() => navigate("/documents")}
            />
            <CarteStat
              icone={Wallet}
              chiffre={`${montantTotal.toLocaleString("fr-FR")} GNF`}
              label={t("montant_total_verse")}
              couleur="vert"
              onClick={() => navigate("/paiements")}
            />
          </>
        )}

        {peutVoirReclamations && (
          <CarteStat
            icone={MessageSquareWarning}
            chiffre={reclamationsOuvertes}
            label={t("reclamations_nouvelles")}
            couleur="rouge"
            onClick={() => navigate("/reclamations")}
          />
        )}

        {peutVoirLogistique && (
          <>
            <CarteStat
              icone={Plane}
              chiffre={groupes.length}
              label={t("groupes_actifs")}
              couleur="violet"
              onClick={() => navigate("/groupes")}
            />
            <CarteStat
              icone={Building2}
              chiffre={hotels.length}
              label={t("hotels_enregistres")}
              couleur="bleu"
              onClick={() => navigate("/hebergement")}
            />
          </>
        )}
      </div>

      {/* ---------- Grille principale ---------- */}
      <div className={styles.grillePrincipale}>
        <div className={styles.cartePrincipale}>
          <h2 className={styles.titreCarte}>{t("repartition_statuts")}</h2>
          {repartition.length === 0 ? (
            <p className={styles.etatVide}>{t("aucun_pelerin")}</p>
          ) : (
            <div className={styles.zoneGraphique}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={repartition} dataKey="valeur" nameKey="statut" innerRadius={50} outerRadius={80} paddingAngle={2}>
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

        {peutVoirLogistique && (
          <div className={styles.cartePrincipale}>
            <div className={styles.enteteCarteAvecLien}>
              <h2 className={styles.titreCarte}>{t("prochains_departs")}</h2>
              <button className={styles.lienVoirTout} onClick={() => navigate("/groupes")}>{t("voir_tout")}</button>
            </div>
            {prochainsDeparts.length === 0 ? (
              <p className={styles.etatVide}>{t("aucun_depart_a_venir")}</p>
            ) : (
              <div className={styles.listeDeparts}>
                {prochainsDeparts.map((g) => (
                  <div key={g.id} className={styles.ligneDepart} onClick={() => navigate(`/groupes/${g.id}`)}>
                    <div className={styles.dateDepart}>
                      <span className={styles.jourDepart}>{new Date(g.vol_aller_detail.date_vol).getDate()}</span>
                      <span className={styles.moisDepart}>{new Date(g.vol_aller_detail.date_vol).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    </div>
                    <div className={styles.infosDepart}>
                      <p className={styles.nomGroupeDepart}>{g.nom}</p>
                      <p className={styles.trajetDepart}>{g.vol_aller_detail.aeroport_depart} → {g.vol_aller_detail.aeroport_arrivee}</p>
                    </div>
                    <span className={styles.nbPelerinsDepart}>{g.nb_pelerins}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- Grille secondaire ---------- */}
      {(peutVoirLogistique || peutVoirFinances) && (
        <div className={styles.grilleSecondaire}>
          {peutVoirLogistique && (
            <div className={styles.cartePrincipale}>
              <div className={styles.enteteCarteAvecLien}>
                <h2 className={styles.titreCarte}>{t("reservations_hotels")}</h2>
                <button className={styles.lienVoirTout} onClick={() => navigate("/hebergement")}>{t("voir_tout")}</button>
              </div>
              {hotels.length === 0 ? (
                <p className={styles.etatVide}>{t("aucun_hotel_enregistre")}</p>
              ) : (
                <div className={styles.listeHotels}>
                  {hotels.slice(0, 3).map((h) => (
                    <div key={h.id} className={styles.ligneHotel} onClick={() => navigate(`/hebergement/${h.id}`)}>
                      <div className={`${styles.pointVille} ${styles["ville_" + h.ville]}`} />
                      <div className={styles.infosHotel}>
                        <p className={styles.nomHotel}>{h.nom}</p>
                        <p className={styles.villeHotel}>{t(`ville_${h.ville}`)}</p>
                      </div>
                      <span className={styles.occupationHotel}>{h.occupants_totaux}/{h.capacite_totale}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {peutVoirFinances && resumeFinancier && (
            <div className={styles.cartePrincipale}>
              <h2 className={styles.titreCarte}>{t("resume_financier")}</h2>
              <div className={styles.blocsFinance}>
                <div className={styles.blocFinance}>
                  <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_general).toLocaleString("fr-FR")}</p>
                  <p className={styles.labelFinance}>{t("total_general_court")} (GNF)</p>
                </div>
                <div className={styles.blocFinance}>
                  <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_mois_courant).toLocaleString("fr-FR")}</p>
                  <p className={styles.labelFinance}>{t("ce_mois")} (GNF)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CarteStat({ icone: Icone, chiffre, label, couleur, onClick }) {
  return (
    <div className={styles.carteStat} onClick={onClick} style={onClick ? { cursor: "pointer" } : {}}>
      <div className={`${styles.iconeCercle} ${styles["cercle_" + couleur]}`}>
        <Icone size={18} />
      </div>
      <div>
        <p className={styles.chiffreStat}>{chiffre}</p>
        <p className={styles.labelStat}>{label}</p>
      </div>
    </div>
  );
}

export default Dashboard;