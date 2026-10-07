import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil, Download } from "lucide-react";
import { programmeOumraService } from "../../services/programmeOumraService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/moduleVoyage/PageForfaitsModule.module.css";

const TYPES_PROGRAMME = [
  ["oumra_classique", "Oumra"],
  ["oumra_ramadan", "Oumra Ramadan"],
  ["oumra_speciale", "Oumra spéciale"],
];
const STATUTS = [
  ["brouillon", "Brouillon"], ["ouvert", "Ouvert aux inscriptions"], ["complet", "Complet"],
  ["cloture", "Clôturé"], ["archive", "Archivé"],
];
const COULEURS_STATUT = {
  brouillon: "#8A93A6", ouvert: "#2F9E5C", complet: "#C7A44A", cloture: "#2B6CE0", archive: "#5B6475",
};
const TYPES_CHAMBRE = [
  ["individuelle", "Individuelle"], ["double", "Double"], ["triple", "Triple"],
  ["quadruple", "Quadruple"], ["quintuple", "Quintuple"], ["sextuple", "Sextuple"],
];
const TYPES_TRAJET = [
  ["aeroport_hotel", "Aéroport → hôtel"], ["makkah_medine", "Makkah → Médine"],
  ["medine_aeroport", "Médine → aéroport"], ["autre", "Autre"],
];
const STATUTS_TRANSPORT = [
  ["planifie", "Planifié"], ["confirme", "Confirmé"], ["en_cours", "En cours"],
  ["termine", "Terminé"], ["annule", "Annulé"],
];

const VALEURS_INITIALES = {
  nom: "", type_programme: "oumra_classique", annee: new Date().getFullYear(),
  date_depart: "", date_retour: "", nombre_max_pelerins: "", responsable: "",
  statut: "brouillon", planning_valide: false,
};

const sejourVide = (ville) => ({
  ville, hotel: "", hotel_nom: "", hotel_adresse: "", date_arrivee: "", date_depart: "",
  distance_haram_metres: "", type_chambre: "", capacite_chambre: "", repas_inclus: "",
  prestations_incluses: "", visites_ziyarat: "", activites_religieuses: "", transport: "", responsable: "",
});
const TRANSPORT_VIDE = {
  type_trajet: "aeroport_hotel", type_vehicule: "", prestataire: "", date_heure: "",
  nombre_pelerins: "", chauffeur_nom: "", chauffeur_contact: "", statut: "planifie",
};
const ACTIVITE_VIDE = { date: "", ville: "", heure: "", activite: "", lieu: "", responsable: "" };

// Les champs numériques / date vides doivent partir en null, pas en "".
const NULLABLES = [
  "date_arrivee", "date_depart", "hotel", "distance_haram_metres", "capacite_chambre",
  "nombre_max_pelerins", "date_heure", "nombre_pelerins", "heure",
];
const normaliser = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" && NULLABLES.includes(k) ? null : v]));

// Recopie les champs connus d'un objet API en remplaçant null par la valeur vide.
const depuisApi = (obj, modele) =>
  Object.fromEntries(Object.keys(modele).map((k) => [k, obj[k] ?? modele[k]]));

const nuits = (a, d) => {
  if (!a || !d) return null;
  const n = Math.round((new Date(d) - new Date(a)) / 86400000);
  return n >= 0 ? n : null;
};

const carteLigne = { border: "1px solid #E3E7EF", borderRadius: 10, padding: 12, marginBottom: 10 };
const enteteLigne = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontWeight: 600 };

function Champ({ label, children }) {
  return (
    <div className={styles.champ}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function PageProgrammesOumra({ basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [programmes, setProgrammes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [aModifier, setAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [sejours, setSejours] = useState([]);
  const [transports, setTransports] = useState([]);
  const [planning, setPlanning] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  const charger = () => {
    setChargement(true);
    programmeOumraService.lister().then(({ data }) => {
      setProgrammes(data);
      setChargement(false);
    });
  };

  useEffect(() => {
    charger();
    programmeOumraService.listerHotels().then(({ data }) => {
      setHotels(data.filter((h) => !h.type_voyage || h.type_voyage === "oumra"));
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("nouveau")) ouvrirNouveau();
  }, []);

  const ouvrirNouveau = () => {
    setAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setSejours([sejourVide("makkah"), sejourVide("medine")]);
    setTransports([]);
    setPlanning([]);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (p) => {
    setAModifier(p);
    setValeurs(depuisApi(p, VALEURS_INITIALES));
    setSejours(p.sejours.map((s) => depuisApi(s, sejourVide(s.ville))));
    setTransports(p.transports.map((tr) => {
      const ligne = depuisApi(tr, TRANSPORT_VIDE);
      return { ...ligne, date_heure: ligne.date_heure ? ligne.date_heure.slice(0, 16) : "" };
    }));
    setPlanning(p.planning.map((a) => {
      const ligne = depuisApi(a, ACTIVITE_VIDE);
      return { ...ligne, heure: ligne.heure ? ligne.heure.slice(0, 5) : "" };
    }));
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));
  const majListe = (setter) => (index, champ, val) =>
    setter((liste) => liste.map((l, i) => (i === index ? { ...l, [champ]: val } : l)));
  const majSejour = majListe(setSejours);
  const majTransport = majListe(setTransports);
  const majActivite = majListe(setPlanning);

  const choisirHotel = (index, hotelId) => {
    const h = hotels.find((x) => String(x.id) === String(hotelId));
    setSejours((liste) => liste.map((s, i) => {
      if (i !== index) return s;
      if (!h) return { ...s, hotel: "" };
      return {
        ...s,
        hotel: h.id,
        hotel_nom: h.nom || s.hotel_nom,
        hotel_adresse: h.adresse || s.hotel_adresse,
        distance_haram_metres: h.distance_haram_metres ?? s.distance_haram_metres,
      };
    }));
  };

  const handleSubmit = async () => {
    setErreur("");
    if (!valeurs.nom.trim() || !valeurs.date_depart || !valeurs.date_retour) {
      setErreur(t("champs_obligatoires_manquants", "Champs obligatoires manquants"));
      return;
    }
    setEnvoi(true);
    try {
      const donnees = {
        ...normaliser(valeurs),
        sejours: sejours.map(normaliser),
        transports: transports.map(normaliser),
        planning: planning.filter((a) => a.date && a.activite.trim()).map(normaliser),
      };
      if (aModifier) {
        await programmeOumraService.modifier(aModifier.id, donnees);
      } else {
        await programmeOumraService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === "object") {
        setErreur(Object.entries(d).map(([c, m]) => `${c} : ${typeof m === "string" ? m : JSON.stringify(m)}`).join(" — "));
      } else {
        setErreur(t("erreur_enregistrement"));
      }
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await programmeOumraService.supprimer(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  const exporterPdf = (p, e) => {
    e.stopPropagation();
    telechargerFichierProtege(programmeOumraService.urlPlanningPdf(p.id), `planning_${p.reference || p.id}.pdf`);
  };

  const dureeAffichee = valeurs.date_depart && valeurs.date_retour && nuits(valeurs.date_depart, valeurs.date_retour) !== null
    ? `${nuits(valeurs.date_depart, valeurs.date_retour) + 1} jours / ${nuits(valeurs.date_depart, valeurs.date_retour)} nuits`
    : "—";

  return (
    <div className={styles.page}>
      <button className={styles.retour} onClick={() => navigate(`${basePath}/forfaits`)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("programmes_oumra", "Programmes Oumra")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_programme", "Nouveau programme")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && programmes.length === 0 && <p className={styles.etatVide}>{t("aucun_programme", "Aucun programme")}</p>}
        {!chargement && programmes.map((p) => (
          <div key={p.id} className={styles.carte} style={{ "--couleur-standard": COULEURS_STATUT[p.statut] }}>
            <span className={styles.barreHaut} />
            <div className={styles.bandeau}>
              <span className={styles.badge}>{p.statut_display}</span>
              <div className={styles.actions}>
                <button onClick={() => ouvrirModification(p)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={() => setASupprimer(p)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className={styles.nom}>{p.nom}</h3>
            <p className={styles.sousLibelleTotal}>{p.reference} — {p.type_programme_display} {p.annee}</p>
            <p className={styles.places}>{p.date_depart} → {p.date_retour} ({p.duree_jours} j / {p.duree_nuits} nuits)</p>
            <p className={styles.places}>
              {p.nb_pelerins}{p.nombre_max_pelerins ? ` / ${p.nombre_max_pelerins}` : ""} {t("pelerins", "pèlerins")}
              {p.responsable ? ` — ${p.responsable}` : ""}
            </p>
            <button
              className={styles.boutonExport}
              onClick={(e) => exporterPdf(p, e)}
              disabled={!p.planning_valide}
              title={p.planning_valide ? "" : t("planning_non_valide", "Planning non validé")}
            >
              <Download size={13} /> {t("exporter_planning_pdf", "Planning PDF")}
            </button>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneauLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{aModifier ? t("modifier_programme", "Modifier le programme") : t("nouveau_programme", "Nouveau programme")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>

            <div className={styles.formulaire}>
              {/* 1. Informations générales */}
              <div className={styles.sectionTitre}>1. {t("infos_generales", "Informations générales")}</div>
              {aModifier?.reference && <p className={styles.sousLibelleTotal}>{t("reference", "Référence")} : {aModifier.reference}</p>}
              <Champ label={t("nom_programme", "Nom du programme")}>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} placeholder="Oumra Ramadan 2027" />
              </Champ>
              <div className={styles.ligneDeux}>
                <Champ label={t("type", "Type")}>
                  <select value={valeurs.type_programme} onChange={(e) => majChamp("type_programme", e.target.value)}>
                    {TYPES_PROGRAMME.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                  </select>
                </Champ>
                <Champ label={t("annee_saison", "Année / saison")}>
                  <input type="number" value={valeurs.annee} onChange={(e) => majChamp("annee", e.target.value)} />
                </Champ>
              </div>
              <div className={styles.ligneDeux}>
                <Champ label={t("date_depart", "Date de départ")}>
                  <input type="date" value={valeurs.date_depart} onChange={(e) => majChamp("date_depart", e.target.value)} />
                </Champ>
                <Champ label={t("date_retour", "Date de retour")}>
                  <input type="date" value={valeurs.date_retour} onChange={(e) => majChamp("date_retour", e.target.value)} />
                </Champ>
              </div>
              <p className={styles.sousLibelleTotal}>{t("duree_sejour", "Durée totale du séjour")} : <strong>{dureeAffichee}</strong></p>
              <div className={styles.ligneDeux}>
                <Champ label={t("nombre_max_pelerins", "Nombre maximum de pèlerins")}>
                  <input type="number" min="0" value={valeurs.nombre_max_pelerins} onChange={(e) => majChamp("nombre_max_pelerins", e.target.value)} />
                </Champ>
                <Champ label={t("responsable_programme", "Responsable du programme")}>
                  <input value={valeurs.responsable} onChange={(e) => majChamp("responsable", e.target.value)} />
                </Champ>
              </div>
              <Champ label={t("statut", "Statut")}>
                <select value={valeurs.statut} onChange={(e) => majChamp("statut", e.target.value)}>
                  {STATUTS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                </select>
              </Champ>

              {/* 3 et 4. Séjours Makkah / Médine */}
              {sejours.map((s, i) => {
                const estMakkah = s.ville === "makkah";
                const n = nuits(s.date_arrivee, s.date_depart);
                return (
                  <div key={i}>
                    <div className={styles.sectionTitre}>{estMakkah ? "3. Séjour à Makkah" : "4. Séjour à Médine"}</div>
                    <Champ label={t("hotel_existant", "Hôtel (liste Hébergement)")}>
                      <select value={s.hotel} onChange={(e) => choisirHotel(i, e.target.value)}>
                        <option value="">— {t("saisie_manuelle", "saisie manuelle")} —</option>
                        {hotels.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
                      </select>
                    </Champ>
                    <div className={styles.ligneDeux}>
                      <Champ label={t("nom_hotel", "Nom de l'hôtel")}>
                        <input value={s.hotel_nom} onChange={(e) => majSejour(i, "hotel_nom", e.target.value)} />
                      </Champ>
                      <Champ label={t("adresse_hotel", "Adresse de l'hôtel")}>
                        <input value={s.hotel_adresse} onChange={(e) => majSejour(i, "hotel_adresse", e.target.value)} />
                      </Champ>
                    </div>
                    <div className={styles.ligneDeux}>
                      <Champ label={t("date_arrivee", "Date d'arrivée")}>
                        <input type="date" value={s.date_arrivee} onChange={(e) => majSejour(i, "date_arrivee", e.target.value)} />
                      </Champ>
                      <Champ label={t("date_depart_hotel", "Date de départ")}>
                        <input type="date" value={s.date_depart} onChange={(e) => majSejour(i, "date_depart", e.target.value)} />
                      </Champ>
                    </div>
                    <p className={styles.sousLibelleTotal}>{t("nombre_nuits", "Nombre de nuits")} : <strong>{n ?? "—"}</strong></p>
                    {estMakkah && (
                      <Champ label={t("distance_haram", "Distance de la Mosquée sacrée (mètres)")}>
                        <input type="number" min="0" value={s.distance_haram_metres} onChange={(e) => majSejour(i, "distance_haram_metres", e.target.value)} />
                      </Champ>
                    )}
                    <div className={styles.ligneDeux}>
                      <Champ label={t("type_chambre", "Type de chambre")}>
                        <select value={s.type_chambre} onChange={(e) => majSejour(i, "type_chambre", e.target.value)}>
                          <option value="">—</option>
                          {TYPES_CHAMBRE.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                        </select>
                      </Champ>
                      <Champ label={t("capacite", "Capacité")}>
                        <input type="number" min="0" value={s.capacite_chambre} onChange={(e) => majSejour(i, "capacite_chambre", e.target.value)} placeholder={t("auto", "auto")} />
                      </Champ>
                    </div>
                    <Champ label={t("repas_inclus", "Repas inclus")}>
                      <textarea rows={2} value={s.repas_inclus} onChange={(e) => majSejour(i, "repas_inclus", e.target.value)} />
                    </Champ>
                    {estMakkah && (
                      <Champ label={t("prestations_incluses", "Prestations incluses")}>
                        <textarea rows={2} value={s.prestations_incluses} onChange={(e) => majSejour(i, "prestations_incluses", e.target.value)} />
                      </Champ>
                    )}
                    <Champ label={t("visites_ziyarat", "Visites / Ziyarat")}>
                      <textarea rows={2} value={s.visites_ziyarat} onChange={(e) => majSejour(i, "visites_ziyarat", e.target.value)} />
                    </Champ>
                    {!estMakkah && (
                      <Champ label={t("activites_religieuses", "Activités religieuses")}>
                        <textarea rows={2} value={s.activites_religieuses} onChange={(e) => majSejour(i, "activites_religieuses", e.target.value)} />
                      </Champ>
                    )}
                    <div className={styles.ligneDeux}>
                      <Champ label={t("transport", "Transport")}>
                        <input value={s.transport} onChange={(e) => majSejour(i, "transport", e.target.value)} />
                      </Champ>
                      <Champ label={t("responsable", "Responsable")}>
                        <input value={s.responsable} onChange={(e) => majSejour(i, "responsable", e.target.value)} />
                      </Champ>
                    </div>
                  </div>
                );
              })}

              {/* 5. Transport terrestre */}
              <div className={styles.sectionTitre}>5. {t("transport_terrestre", "Transport terrestre")}</div>
              {transports.map((tr, i) => (
                <div key={i} style={carteLigne}>
                  <div style={enteteLigne}>
                    <span>{t("trajet", "Trajet")} {i + 1}</span>
                    <button type="button" className={styles.boutonRetirerLigne} onClick={() => setTransports((l) => l.filter((_, k) => k !== i))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("type_trajet", "Trajet")}>
                      <select value={tr.type_trajet} onChange={(e) => majTransport(i, "type_trajet", e.target.value)}>
                        {TYPES_TRAJET.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                      </select>
                    </Champ>
                    <Champ label={t("date_heure", "Date et heure")}>
                      <input type="datetime-local" value={tr.date_heure} onChange={(e) => majTransport(i, "date_heure", e.target.value)} />
                    </Champ>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("type_vehicule", "Type de véhicule / bus")}>
                      <input value={tr.type_vehicule} onChange={(e) => majTransport(i, "type_vehicule", e.target.value)} />
                    </Champ>
                    <Champ label={t("prestataire", "Prestataire de transport")}>
                      <input value={tr.prestataire} onChange={(e) => majTransport(i, "prestataire", e.target.value)} />
                    </Champ>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("chauffeur", "Chauffeur")}>
                      <input value={tr.chauffeur_nom} onChange={(e) => majTransport(i, "chauffeur_nom", e.target.value)} />
                    </Champ>
                    <Champ label={t("contact", "Contact")}>
                      <input value={tr.chauffeur_contact} onChange={(e) => majTransport(i, "chauffeur_contact", e.target.value)} />
                    </Champ>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("nombre_pelerins_concernes", "Pèlerins concernés")}>
                      <input type="number" min="0" value={tr.nombre_pelerins} onChange={(e) => majTransport(i, "nombre_pelerins", e.target.value)} />
                    </Champ>
                    <Champ label={t("statut_transport", "Statut du transport")}>
                      <select value={tr.statut} onChange={(e) => majTransport(i, "statut", e.target.value)}>
                        {STATUTS_TRANSPORT.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
                      </select>
                    </Champ>
                  </div>
                </div>
              ))}
              <button type="button" className={styles.boutonAjouterLigne} onClick={() => setTransports((l) => [...l, { ...TRANSPORT_VIDE }])}>
                <Plus size={14} /> {t("ajouter_trajet", "Ajouter un trajet")}
              </button>

              {/* 6. Planning journalier */}
              <div className={styles.sectionTitre}>6. {t("planning_journalier", "Planning journalier")}</div>
              {planning.map((a, i) => (
                <div key={i} style={carteLigne}>
                  <div style={enteteLigne}>
                    <span>{t("activite", "Activité")} {i + 1}</span>
                    <button type="button" className={styles.boutonRetirerLigne} onClick={() => setPlanning((l) => l.filter((_, k) => k !== i))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("date", "Date")}>
                      <input type="date" value={a.date} onChange={(e) => majActivite(i, "date", e.target.value)} />
                    </Champ>
                    <Champ label={t("heure", "Heure")}>
                      <input type="time" value={a.heure} onChange={(e) => majActivite(i, "heure", e.target.value)} />
                    </Champ>
                  </div>
                  <div className={styles.ligneDeux}>
                    <Champ label={t("ville", "Ville")}>
                      <input list="villes-planning" value={a.ville} onChange={(e) => majActivite(i, "ville", e.target.value)} />
                    </Champ>
                    <Champ label={t("lieu", "Lieu")}>
                      <input value={a.lieu} onChange={(e) => majActivite(i, "lieu", e.target.value)} />
                    </Champ>
                  </div>
                  <Champ label={t("activite", "Activité")}>
                    <input value={a.activite} onChange={(e) => majActivite(i, "activite", e.target.value)} />
                  </Champ>
                  <Champ label={t("responsable", "Responsable")}>
                    <input value={a.responsable} onChange={(e) => majActivite(i, "responsable", e.target.value)} />
                  </Champ>
                </div>
              ))}
              <datalist id="villes-planning">
                <option value="Makkah" /><option value="Médine" /><option value="Djeddah" /><option value="Conakry" />
              </datalist>
              <button type="button" className={styles.boutonAjouterLigne} onClick={() => setPlanning((l) => [...l, { ...ACTIVITE_VIDE }])}>
                <Plus size={14} /> {t("ajouter_activite", "Ajouter une activité")}
              </button>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginTop: 10 }}>
                <input type="checkbox" checked={valeurs.planning_valide} onChange={(e) => majChamp("planning_valide", e.target.checked)} />
                {t("planning_valide", "Planning validé (autorise l'export PDF pour les pèlerins)")}
              </label>

              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="button" className={styles.boutonPrincipal} onClick={handleSubmit} disabled={envoi}>
                  {envoi ? t("enregistrement") : t("enregistrer")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <ModalConfirmation
          titre={t("confirmer_suppression_titre")}
          message={t("confirmer_suppression_message")}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}

export default PageProgrammesOumra;