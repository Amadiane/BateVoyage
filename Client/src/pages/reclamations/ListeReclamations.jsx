import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { reclamationService } from "../../services/reclamationService";
import { pelerinService } from "../../services/pelerinService";
import { utilisateurService } from "../../services/utilisateurService";
import styles from "../../theme/pages/reclamations/ListeReclamations.module.css";

const VALEURS_INITIALES = { pelerin: "", sujet: "", description: "", priorite: "normale", assigne_a: "" };

function nomAffiche(u) {
  return (u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}` : u.username;
}

function ListeReclamations() {
  const { t } = useTranslation();
  const [reclamations, setReclamations] = useState([]);
  const [pelerins, setPelerins] = useState([]);
  const [agents, setAgents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtrePriorite, setFiltrePriorite] = useState("");
  const [recherche, setRecherche] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [reclamationSelectionnee, setReclamationSelectionnee] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (filtreStatut) params.statut = filtreStatut;
      if (filtrePriorite) params.priorite = filtrePriorite;
      if (recherche) params.search = recherche;
      const { data } = await reclamationService.lister(params);
      setReclamations(data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [filtreStatut, filtrePriorite, recherche]);

  useEffect(() => {
    pelerinService.lister().then(({ data }) => setPelerins(data));
    utilisateurService.listerComptes().then(({ data }) => {
      setAgents(data.filter((u) => ["fondateur", "admin_general", "affaires_sociales"].includes(u.role)));
    }).catch(() => setAgents([]));
  }, []);

  const ouvrirNouvelle = () => {
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await reclamationService.creer(valeurs);
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_reclamations")}</h1>
          <p className={styles.sousTitre}>{reclamations.length} {t("reclamations_enregistrees")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouvelle}>
          <Plus size={16} /> {t("nouvelle_reclamation")}
        </button>
      </div>

      <div className={styles.barreOutils}>
        <input
          type="text"
          placeholder={t("rechercher_reclamation")}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className={styles.champRecherche}
        />
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_statuts")}</option>
          <option value="nouvelle">{t("statut_reclam_nouvelle")}</option>
          <option value="en_cours">{t("statut_reclam_en_cours")}</option>
          <option value="resolue">{t("statut_reclam_resolue")}</option>
          <option value="fermee">{t("statut_reclam_fermee")}</option>
        </select>
        <select value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("toutes_priorites")}</option>
          <option value="basse">{t("priorite_basse")}</option>
          <option value="normale">{t("priorite_normale")}</option>
          <option value="haute">{t("priorite_haute")}</option>
          <option value="urgente">{t("priorite_urgente")}</option>
        </select>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("sujet")}</th>
              <th>{t("pelerin")}</th>
              <th>{t("priorite")}</th>
              <th>{t("statut")}</th>
              <th>{t("assigne_a")}</th>
              <th>{t("date")}</th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={6} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && reclamations.length === 0 && <tr><td colSpan={6} className={styles.etatVide}>{t("aucune_reclamation")}</td></tr>}
            {!chargement && reclamations.map((r) => (
              <tr key={r.id} className={styles.ligneCliquable} onClick={() => setReclamationSelectionnee(r)}>
                <td className={styles.cellSujet}>{r.sujet}</td>
                <td>
                  <span className={styles.cellId}>{r.pelerin_numero_id}</span> — {r.pelerin_nom}
                </td>
                <td><span className={`${styles.badge} ${styles["priorite_" + r.priorite]}`}>{r.priorite_display}</span></td>
                <td><span className={`${styles.badge} ${styles["statut_" + r.statut]}`}>{r.statut_display}</span></td>
                <td className={styles.cellAgent}>{r.assigne_a_nom || "—"}</td>
                <td className={styles.cellDate}>{new Date(r.date_creation).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{t("nouvelle_reclamation")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("pelerin")}</label>
                <select value={valeurs.pelerin} onChange={(e) => majChamp("pelerin", e.target.value)} required>
                  <option value="">—</option>
                  {pelerins.map((p) => <option key={p.id} value={p.id}>{p.numero_id} — {p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("sujet")}</label>
                <input value={valeurs.sujet} onChange={(e) => majChamp("sujet", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("description")}</label>
                <textarea rows={4} value={valeurs.description} onChange={(e) => majChamp("description", e.target.value)} required />
              </div>
              <div className={styles.ligneDeuxColonnes}>
                <div className={styles.champ}>
                  <label>{t("priorite")}</label>
                  <select value={valeurs.priorite} onChange={(e) => majChamp("priorite", e.target.value)}>
                    <option value="basse">{t("priorite_basse")}</option>
                    <option value="normale">{t("priorite_normale")}</option>
                    <option value="haute">{t("priorite_haute")}</option>
                    <option value="urgente">{t("priorite_urgente")}</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("assigne_a")} <span style={{ color: "#DC2626" }}>*</span></label>
                  <select value={valeurs.assigne_a} onChange={(e) => majChamp("assigne_a", e.target.value)} required>
                    <option value="">—</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{nomAffiche(a)}</option>)}
                  </select>
                </div>
              </div>
              {erreur && <p className={styles.erreur}>{erreur}</p>}
              <div className={styles.navigationModal}>
                <button type="button" className={styles.boutonSecondaire} onClick={() => setModalOuverte(false)}>{t("annuler")}</button>
                <button type="submit" className={styles.boutonPrincipal} disabled={envoi}>{envoi ? t("enregistrement") : t("enregistrer")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reclamationSelectionnee && (
        <PanneauDetailReclamation
          reclamation={reclamationSelectionnee}
          agents={agents}
          onFermer={() => setReclamationSelectionnee(null)}
          onMaj={() => { charger(); setReclamationSelectionnee(null); }}
        />
      )}
    </div>
  );
}

function PanneauDetailReclamation({ reclamation, agents, onFermer, onMaj }) {
  const { t } = useTranslation();
  const [statut, setStatut] = useState(reclamation.statut);
  const [priorite, setPriorite] = useState(reclamation.priorite);
  const [assigneA, setAssigneA] = useState(reclamation.assigne_a || "");
  const [reponse, setReponse] = useState(reclamation.reponse || "");
  const [envoi, setEnvoi] = useState(false);

  const enregistrer = async () => {
    setEnvoi(true);
    try {
      const donnees = { statut, priorite, reponse };
      if (assigneA) donnees.assigne_a = assigneA;
      await reclamationService.modifier(reclamation.id, donnees);
      onMaj();
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.superposition} onClick={onFermer}>
      <div className={styles.panneauDetail} onClick={(e) => e.stopPropagation()}>
        <div className={styles.enteteModal}>
          <h2>{reclamation.sujet}</h2>
          <button className={styles.boutonFermer} onClick={onFermer}><X size={16} /></button>
        </div>

        <p className={styles.metaDetail}>{reclamation.pelerin_numero_id} — {reclamation.pelerin_nom}</p>
        <p className={styles.metaDetail}>{t("cree_par")} {reclamation.cree_par_nom} — {new Date(reclamation.date_creation).toLocaleDateString("fr-FR")}</p>

        <p className={styles.descriptionDetail}>{reclamation.description}</p>

        <div className={styles.ligneDeuxColonnes} style={{ marginTop: 16 }}>
          <div className={styles.champ}>
            <label>{t("statut")}</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="nouvelle">{t("statut_reclam_nouvelle")}</option>
              <option value="en_cours">{t("statut_reclam_en_cours")}</option>
              <option value="resolue">{t("statut_reclam_resolue")}</option>
              <option value="fermee">{t("statut_reclam_fermee")}</option>
            </select>
          </div>
          <div className={styles.champ}>
            <label>{t("priorite")}</label>
            <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              <option value="basse">{t("priorite_basse")}</option>
              <option value="normale">{t("priorite_normale")}</option>
              <option value="haute">{t("priorite_haute")}</option>
              <option value="urgente">{t("priorite_urgente")}</option>
            </select>
          </div>
        </div>

        <div className={styles.champ}>
          <label>{t("assigne_a")}</label>
          <select value={assigneA} onChange={(e) => setAssigneA(e.target.value)}>
            <option value="">—</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{nomAffiche(a)}</option>)}
          </select>
        </div>

        <div className={styles.champ}>
          <label>{t("reponse_agence")}</label>
          <textarea rows={4} value={reponse} onChange={(e) => setReponse(e.target.value)} placeholder={t("saisir_reponse")} />
        </div>

        <div className={styles.navigationModal}>
          <button type="button" className={styles.boutonSecondaire} onClick={onFermer}>{t("annuler")}</button>
          <button type="button" className={styles.boutonPrincipal} onClick={enregistrer} disabled={envoi}>
            {envoi ? t("enregistrement") : t("enregistrer")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListeReclamations;