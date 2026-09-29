import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users, FileWarning, FileClock, Wallet, MessageSquareWarning, Plane, Building2, Bell,
  ChevronDown, LogOut, User, TrendingUp, TrendingDown, PiggyBank, UserX, UserPlus, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { pelerinService } from "../../services/pelerinService";
import { documentService } from "../../services/documentService";
import { reclamationService } from "../../services/reclamationService";
import { groupeService } from "../../services/groupeService";
import { hotelService } from "../../services/hotelService";
import { paiementService } from "../../services/paiementService";
import { decaissementService } from "../../services/decaissementService";
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

// Couleurs fixées en JS (plutôt que via des classes CSS existantes dont on n'a pas
// le contenu) pour garantir un rendu coloré dès le premier essai.
const COULEURS_CARTE = {
  bleu: "#2B6CE0",
  orange: "#E08A2B",
  or: "#C9972B",
  vert: "#1F7A4D",
  rouge: "#B4433A",
  violet: "#7C5CBF",
};

const ROLES_VOIENT_FINANCES = ["fondateur", "admin_general", "comptable", "secretaire"];
const ROLES_VOIENT_RECLAMATIONS = ["fondateur", "admin_general", "affaires_sociales"];
const ROLES_VOIENT_LOGISTIQUE = ["fondateur", "admin_general", "secretaire", "guide", "encadreur", "mounazim"];

// Le service pèlerin filtre par "type_voyage" (pelerinage/oumra), pas par "activite"
// (hajj/oumra) comme le fait le service comptabilité — cf. PageDecaissement.jsx.
const TYPE_VOYAGE_PAR_ACTIVITE = { hajj: "pelerinage", oumra: "oumra" };

const DEVISES = ["GNF", "USD", "SAR"];

function sommerParDevise(liste) {
  return DEVISES.reduce((acc, dev) => {
    acc[dev] = liste.filter((x) => x.devise === dev).reduce((s, x) => s + parseFloat(x.montant), 0);
    return acc;
  }, {});
}

function formaterMontantsNonNuls(totaux) {
  return DEVISES.filter((d) => totaux[d] > 0).map((d) => `${totaux[d].toLocaleString("fr-FR")} ${d}`).join(" · ") || "0";
}

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { utilisateur, deconnecter } = useAuth();
  const [pelerins, setPelerins] = useState([]);
  const [docs, setDocs] = useState(null);
  const [reclamationsOuvertes, setReclamationsOuvertes] = useState(0);
  const [groupes, setGroupes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [resumeFinancier, setResumeFinancier] = useState(null);
  const [dettesOuvertes, setDettesOuvertes] = useState([]);
  const [creancesOuvertes, setCreancesOuvertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef(null);

  // ---------- Sélecteur Global / Hajj / Omra ----------
  const [activiteVue, setActiviteVue] = useState("global");
  const [financeActivite, setFinanceActivite] = useState(null);
  const [chargementFinanceActivite, setChargementFinanceActivite] = useState(false);

  const peutVoirFinances = ROLES_VOIENT_FINANCES.includes(utilisateur?.role);
  const peutVoirReclamations = ROLES_VOIENT_RECLAMATIONS.includes(utilisateur?.role);
  const peutVoirLogistique = ROLES_VOIENT_LOGISTIQUE.includes(utilisateur?.role);

  useEffect(() => {
    const requetes = [pelerinService.lister()];
    if (peutVoirFinances) {
      requetes.push(documentService.obtenirTableauBord());
      requetes.push(paiementService.obtenirResumeFinancier());
      requetes.push(decaissementService.listerDettes({ soldee: false }));
      requetes.push(decaissementService.listerCreances({ soldee: false }));
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
        setDettesOuvertes(resultats[i++].data);
        setCreancesOuvertes(resultats[i++].data);
      }
      if (peutVoirReclamations) setReclamationsOuvertes(resultats[i++].data.length);
      if (peutVoirLogistique) {
        setGroupes(resultats[i++].data);
        setHotels(resultats[i++].data);
      }
      setChargement(false);
    });
  }, []);

  useEffect(() => {
    function fermerSiExterieur(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  // Rechargement des pèlerins filtrés + du bloc financier dédié quand on change d'activité.
  useEffect(() => {
    if (activiteVue === "global") {
      pelerinService.lister().then(({ data }) => setPelerins(data));
      setFinanceActivite(null);
      return;
    }

    pelerinService.lister({ type_voyage: TYPE_VOYAGE_PAR_ACTIVITE[activiteVue] }).then(({ data }) => setPelerins(data));

    if (!peutVoirFinances) return;

    setChargementFinanceActivite(true);
    decaissementService.listerSaisons(activiteVue).then(async ({ data: saisons }) => {
      const saisonActive = saisons.find((s) => s.est_active) || saisons[0];
      if (!saisonActive) {
        setFinanceActivite({ saison: null });
        setChargementFinanceActivite(false);
        return;
      }
      const [beneficeRes, recapRes, encaissRes] = await Promise.all([
        decaissementService.obtenirBeneficeGlobal(activiteVue, saisonActive.id),
        decaissementService.obtenirRecapitulatif(activiteVue, null, saisonActive.id),
        decaissementService.obtenirEncaissements(activiteVue),
      ]);
      const ligneBeneficeReel = beneficeRes.data.lignes.find((l) => l.cle === "benefice_reel");
      setFinanceActivite({
        saison: saisonActive,
        beneficeReel: ligneBeneficeReel?.valeurs || { gnf: 0, usd: 0, sar: 0 },
        decaisse: recapRes.data.total_general || { gnf: 0, usd: 0, sar: 0 },
        encaisseGnf: encaissRes.data.total || 0,
      });
      setChargementFinanceActivite(false);
    });
  }, [activiteVue]);

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

  const dateAujourdhui = aujourdhui.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const initiales = `${utilisateur?.first_name?.[0] || ""}${utilisateur?.last_name?.[0] || utilisateur?.username?.[0] || ""}`.toUpperCase();

  const dettesOuvertesParDevise = sommerParDevise(dettesOuvertes);
  const creancesOuvertesParDevise = sommerParDevise(creancesOuvertes);

  const statutSaison = (saison) => {
    if (!saison) return null;
    const debut = new Date(saison.date_debut);
    const fin = new Date(saison.date_fin);
    if (aujourdhui < debut) return { texte: t("saison_a_venir"), classe: styles.badgeSaisonAVenir };
    if (aujourdhui > fin) return { texte: t("saison_terminee"), classe: styles.badgeSaisonTerminee };
    return { texte: t("saison_en_cours"), classe: styles.badgeSaisonEnCours };
  };

  return (
    <div>
      {/* ---------- Bandeau héro ---------- */}
      <div className={styles.hero} style={{ backgroundImage: `url(${imageKaaba})` }}>
        <div className={styles.heroOverlay} />

        <div className={styles.heroLigne}>
          <div className={styles.heroContenu}>
            <p className={styles.heroVerset}>وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ</p>
            <h1 className={styles.heroTitre}>{t("bienvenue_virgule")} {utilisateur?.first_name || utilisateur?.username}</h1>
            <p className={styles.heroSousTitre}>{t("connecte_en_tant_que")} {utilisateur?.role_display}</p>
          </div>

          <div className={styles.heroDroite}>
            <span className={styles.heroDate}>{dateAujourdhui}</span>

            <button className={styles.heroBoutonNotif}>
              <Bell size={16} />
            </button>

            <div className={styles.heroMenuProfil} ref={menuRef}>
              <button className={styles.heroBoutonProfil} onClick={() => setMenuOuvert((v) => !v)}>
                {utilisateur?.photo ? (
                  <img src={utilisateur.photo} alt="" className={styles.heroPhotoProfil} />
                ) : (
                  <div className={styles.heroAvatarInitiales}>{initiales || <User size={14} />}</div>
                )}
                <span className={styles.heroNomProfil}>{utilisateur?.first_name || utilisateur?.username}</span>
                <ChevronDown size={13} className={`${styles.heroChevron} ${menuOuvert ? styles.heroChevronOuvert : ""}`} />
              </button>

              {menuOuvert && (
                <div className={styles.heroDropdown}>
                  <div className={styles.heroDropdownEntete}>
                    <p className={styles.heroDropdownNom}>{utilisateur?.first_name} {utilisateur?.last_name}</p>
                    <p className={styles.heroDropdownRole}>{utilisateur?.role_display}</p>
                  </div>
                  <button className={styles.heroDropdownDeconnexion} onClick={deconnecter}>
                    <LogOut size={14} /> {t("se_deconnecter")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Sélecteur Global / Hajj / Omra ---------- */}
      <div className={styles.toggleActivite}>
        {[
          { cle: "global", label: t("vue_globale") },
          { cle: "hajj", label: t("hajj") },
          { cle: "oumra", label: t("oumra") },
        ].map((opt) => (
          <button
            key={opt.cle}
            className={activiteVue === opt.cle ? styles.toggleActiviteBoutonActif : styles.toggleActiviteBouton}
            onClick={() => setActiviteVue(opt.cle)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ---------- Cartes statistiques en tuiles dégradées ---------- */}
      <div className={styles.cartesStat}>
        <CarteStat
          icone={Users}
          chiffre={pelerins.length}
          label={activiteVue === "global" ? t("total_pelerins") : `${t("total_pelerins")} — ${t(activiteVue)}`}
          couleur="bleu"
          onClick={() => navigate("/pelerins")}
        />

        {peutVoirFinances && (
          <>
            <CarteStat
              icone={FileWarning}
              chiffre={docs?.total_dossiers_incomplets ?? docs?.dossiers_incomplets?.length ?? 0}
              label={t("dossiers_incomplets")}
              couleur="orange"
              onClick={() => navigate("/documents")}
            />
            <CarteStat
              icone={FileClock}
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

      {/* ---------- Situation financière de l'activité sélectionnée ---------- */}
      {peutVoirFinances && activiteVue !== "global" && (
        <div className={styles.cartePrincipale} style={{ marginBottom: 20 }}>
          <div className={styles.enteteCarteAvecLien}>
            <h2 className={styles.titreCarte}>
              {t("situation_financiere")} — {t(activiteVue)}
              {financeActivite?.saison && (
                <span className={statutSaison(financeActivite.saison)?.classe} style={{ marginLeft: 10 }}>
                  {financeActivite.saison.nom} · {statutSaison(financeActivite.saison)?.texte}
                </span>
              )}
            </h2>
            <button className={styles.lienVoirTout} onClick={() => navigate(`/comptabilite/finances/benefice-global?activite=${activiteVue}`)}>
              {t("voir_tout")}
            </button>
          </div>

          {chargementFinanceActivite && <p className={styles.etatVide}>{t("chargement")}</p>}

          {!chargementFinanceActivite && financeActivite && !financeActivite.saison && (
            <p className={styles.etatVide}>{t("aucune_saison")}</p>
          )}

          {!chargementFinanceActivite && financeActivite?.saison && (
            <div className={styles.blocsFinanceColores}>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceOr}`}>
                <div className={styles.iconeBlocFinance}><PiggyBank size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.beneficeReel.gnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("benefice_reel")}</p>
                </div>
              </div>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceRouge}`}>
                <div className={styles.iconeBlocFinance}><TrendingDown size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.decaisse.gnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("total_decaisse")}</p>
                </div>
              </div>
              <div className={`${styles.blocFinanceColore} ${styles.blocFinanceVert}`}>
                <div className={styles.iconeBlocFinance}><TrendingUp size={18} /></div>
                <div>
                  <p className={styles.chiffreFinance}>{financeActivite.encaisseGnf.toLocaleString("fr-FR")} GNF</p>
                  <p className={styles.labelFinance}>{t("total_encaisse")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Grille principale ---------- */}
      <div className={styles.grillePrincipale}>
        <div className={`${styles.cartePrincipale} ${styles.accentHautViolet}`}>
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
          <div className={`${styles.cartePrincipale} ${styles.accentHautBleu}`}>
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
            <div className={`${styles.cartePrincipale} ${styles.accentHautOr}`}>
              <div className={styles.enteteCarteAvecLien}>
                <h2 className={styles.titreCarte}>{t("reservations_hotels")}</h2>
                <button className={styles.lienVoirTout} onClick={() => navigate("/hebergement")}>{t("voir_tout")}</button>
              </div>
              {hotels.length === 0 ? (
                <p className={styles.etatVide}>{t("aucun_hotel_enregistre")}</p>
              ) : (
                <div className={styles.listeHotels}>
                  {hotels.slice(0, 3).map((h) => {
                    const ratio = h.capacite_totale > 0 ? h.occupants_totaux / h.capacite_totale : 0;
                    const couleurBarre = ratio >= 0.95 ? "#B4433A" : ratio >= 0.75 ? "#C9972B" : "#1F7A4D";
                    return (
                      <div key={h.id} className={styles.ligneHotelModerne} onClick={() => navigate(`/hebergement/${h.id}`)}>
                        <div className={styles.infosHotel}>
                          <p className={styles.nomHotel}>{h.nom}</p>
                          <p className={styles.villeHotel}>{t(`ville_${h.ville}`)}</p>
                        </div>
                        <div className={styles.occupationModerne}>
                          <div className={styles.barreOccupation}>
                            <div
                              className={styles.barreOccupationRemplie}
                              style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: couleurBarre }}
                            />
                          </div>
                          <span className={styles.occupationHotel} style={{ color: couleurBarre }}>
                            {h.occupants_totaux}/{h.capacite_totale}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {peutVoirFinances && resumeFinancier && (
            <div className={`${styles.cartePrincipale} ${styles.accentHautVert}`}>
              <h2 className={styles.titreCarte}>{t("resume_financier")}</h2>
              <div className={styles.blocsFinanceColores}>
                <div className={`${styles.blocFinanceColore} ${styles.blocFinanceOr}`}>
                  <div className={styles.iconeBlocFinance}><Wallet size={18} /></div>
                  <div>
                    <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_general).toLocaleString("fr-FR")}</p>
                    <p className={styles.labelFinance}>{t("total_general_court")} (GNF)</p>
                  </div>
                </div>
                <div className={`${styles.blocFinanceColore} ${styles.blocFinanceVert}`}>
                  <div className={styles.iconeBlocFinance}><TrendingUp size={18} /></div>
                  <div>
                    <p className={styles.chiffreFinance}>{parseFloat(resumeFinancier.total_mois_courant).toLocaleString("fr-FR")}</p>
                    <p className={styles.labelFinance}>{t("ce_mois")} (GNF)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Dettes & créances ouvertes (toujours global) ---------- */}
      {peutVoirFinances && (dettesOuvertes.length > 0 || creancesOuvertes.length > 0) && (
        <div className={styles.grilleSecondaire}>
          <div className={`${styles.cartePrincipale} ${styles.carteAccentRouge}`}>
            <div className={styles.enteteCarteAvecLien}>
              <h2 className={styles.titreCarte}>
                <span className={styles.iconeCercleModerne} style={{ backgroundColor: "#B4433A18", color: "#B4433A" }}>
                  <UserX size={15} />
                </span>
                {t("dettes_non_soldees")} ({dettesOuvertes.length})
              </h2>
              <button className={styles.lienVoirTout} onClick={() => navigate("/comptabilite/finances/dette")}>{t("voir_tout")}</button>
            </div>
            <p className={styles.montantAccent} style={{ color: "#B4433A" }}>{formaterMontantsNonNuls(dettesOuvertesParDevise)}</p>
          </div>

          <div className={`${styles.cartePrincipale} ${styles.carteAccentVert}`}>
            <div className={styles.enteteCarteAvecLien}>
              <h2 className={styles.titreCarte}>
                <span className={styles.iconeCercleModerne} style={{ backgroundColor: "#1F7A4D18", color: "#1F7A4D" }}>
                  <UserPlus size={15} />
                </span>
                {t("creances_non_soldees")} ({creancesOuvertes.length})
              </h2>
              <button className={styles.lienVoirTout} onClick={() => navigate("/comptabilite/finances/creance")}>{t("voir_tout")}</button>
            </div>
            <p className={styles.montantAccent} style={{ color: "#1F7A4D" }}>{formaterMontantsNonNuls(creancesOuvertesParDevise)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CarteStat({ icone: Icone, chiffre, label, couleur, onClick }) {
  const hex = COULEURS_CARTE[couleur] || "#6B6659";
  return (
    <div
      className={styles.carteStatModerne}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        background: `linear-gradient(150deg, ${hex}14, ${hex}05 65%)`,
        borderColor: `${hex}28`,
      }}
    >
      <Icone className={styles.iconeFantomeStat} style={{ color: hex }} strokeWidth={1.4} />
      <div className={styles.iconeCercleStat} style={{ backgroundColor: hex }}>
        <Icone size={17} color="#fff" strokeWidth={2} />
      </div>
      <p className={styles.chiffreStat} style={{ color: hex }}>{chiffre}</p>
      <p className={styles.labelStat}>{label}</p>
      {onClick && <ArrowUpRight size={15} className={styles.flecheStat} style={{ color: hex }} />}
    </div>
  );
}

export default Dashboard;