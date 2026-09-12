import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { decaissementService } from "../../services/decaissementService";
import { pelerinService } from "../../services/pelerinService";
import ModalConfirmation from "../../components/ModalConfirmation/ModalConfirmation";
import styles from "../../theme/pages/comptabilite/PageDecaissement.module.css";

const DEVISES = ["GNF", "USD", "SAR"];

const VALEURS_INITIALES = {
  categorie: "", libelle_complementaire: "", montant: "", devise: "GNF",
  pelerin: "", date_decaissement: new Date().toISOString().slice(0, 10), notes: "",
};

function PageDecaissement({ activite }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [decaissements, setDecaissements] = useState([]);
  const [pelerins, setPelerins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreDevise, setFiltreDevise] = useState("");
  const [modalOuverte, setModalOuverte] = useState(false);
  const [decaissementAModifier, setDecaissementAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [aSupprimer, setASupprimer] = useState(null);

  // Ajout de catégorie libre ("Autres charges")
  const [ajoutCategorieOuvert, setAjoutCategorieOuvert] = useState(false);
  const [nouvelleCategorieNom, setNouvelleCategorieNom] = useState("");

  const charger = () => {
    setChargement(true);
    decaissementService.listerCategories(activite).then(({ data }) => setCategories(data));
    const params = { activite };
    if (filtreDevise) params.devise = filtreDevise;
    decaissementService.lister(params).then(({ data }) => {
      setDecaissements(data);
      setChargement(false);
    });
    pelerinService.lister({ type_voyage: activite === "hajj" ? "pelerinage" : "oumra" }).then(({ data }) => setPelerins(data));
  };

  useEffect(() => { charger(); }, [activite, filtreDevise]);

  const ouvrirNouveau = () => {
    setDecaissementAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (d) => {
    setDecaissementAModifier(d);
    setValeurs({
      categorie: d.categorie, libelle_complementaire: d.libelle_complementaire || "",
      montant: d.montant, devise: d.devise, pelerin: d.pelerin || "",
      date_decaissement: d.date_decaissement, notes: d.notes || "",
    });
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const ajouterCategorieLibre = async () => {
    if (!nouvelleCategorieNom.trim()) return;
    const { data } = await decaissementService.creerCategorie({ activite, nom: nouvelleCategorieNom });
    setCategories((c) => [...c, data]);
    majChamp("categorie", data.id);
    setNouvelleCategorieNom("");
    setAjoutCategorieOuvert(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = { ...valeurs, activite };
      if (!donnees.pelerin) delete donnees.pelerin;
      if (decaissementAModifier) {
        await decaissementService.modifier(decaissementAModifier.id, donnees);
      } else {
        await decaissementService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerSuppression = async () => {
    await decaissementService.supprimer(aSupprimer.id);
    setASupprimer(null);
    charger();
  };

  const totauxParDevise = DEVISES.reduce((acc, dev) => {
    acc[dev] = decaissements.filter((d) => d.devise === dev).reduce((s, d) => s + parseFloat(d.montant), 0);
    return acc;
  }, {});

  return (
    <div>
      <div className={styles.entete}>
        <h2 className={styles.titre}>{t("decaissements")}</h2>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_decaissement")}
        </button>
      </div>

      <div className={styles.cartesTotaux}>
        {DEVISES.map((dev) => (
          <div key={dev} className={styles.carteTotal}>
            <span className={styles.chiffreTotal}>{totauxParDevise[dev].toLocaleString("fr-FR")}</span>
            <span className={styles.labelTotal}>{dev}</span>
          </div>
        ))}
      </div>

      <div className={styles.barreOutils}>
        <select value={filtreDevise} onChange={(e) => setFiltreDevise(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("toutes_devises")}</option>
          {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("categorie")}</th>
              <th>{t("pelerin_concerne")}</th>
              <th>{t("montant")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && <tr><td colSpan={5} className={styles.etatVide}>{t("chargement")}</td></tr>}
            {!chargement && decaissements.length === 0 && <tr><td colSpan={5} className={styles.etatVide}>{t("aucun_resultat")}</td></tr>}
            {!chargement && decaissements.map((d) => (
              <tr key={d.id}>
                <td>{d.date_decaissement}</td>
                <td>
                  {d.categorie_nom}
                  {d.libelle_complementaire && <span className={styles.libelleComplementaire}> — {d.libelle_complementaire}</span>}
                </td>
                <td>{d.pelerin_nom || "—"}</td>
                <td className={styles.cellMontant}>{parseFloat(d.montant).toLocaleString("fr-FR")} {d.devise}</td>
                <td className={styles.cellActions}>
                  <button onClick={() => ouvrirModification(d)} title={t("modifier")}><Pencil size={13} /></button>
                  <button onClick={() => setASupprimer(d)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{decaissementAModifier ? t("modifier_decaissement") : t("nouveau_decaissement")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("categorie")}</label>
                <select value={valeurs.categorie} onChange={(e) => majChamp("categorie", e.target.value)} required>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {!ajoutCategorieOuvert ? (
                  <button type="button" className={styles.lienAjoutCategorie} onClick={() => setAjoutCategorieOuvert(true)}>
                    + {t("ajouter_autre_charge")}
                  </button>
                ) : (
                  <div className={styles.ligneAjoutCategorie}>
                    <input value={nouvelleCategorieNom} onChange={(e) => setNouvelleCategorieNom(e.target.value)} placeholder={t("nom_nouvelle_charge")} />
                    <button type="button" onClick={ajouterCategorieLibre}>{t("ajouter")}</button>
                  </div>
                )}
              </div>
              <div className={styles.champ}>
                <label>{t("precision_libelle")}</label>
                <input value={valeurs.libelle_complementaire} onChange={(e) => majChamp("libelle_complementaire", e.target.value)} placeholder={t("ex_periode_concernee")} />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("montant")}</label>
                  <input type="number" step="0.01" min="0" value={valeurs.montant} onChange={(e) => majChamp("montant", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("devise")}</label>
                  <select value={valeurs.devise} onChange={(e) => majChamp("devise", e.target.value)}>
                    {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("pelerin_concerne")} ({t("optionnel")})</label>
                <select value={valeurs.pelerin} onChange={(e) => majChamp("pelerin", e.target.value)}>
                  <option value="">—</option>
                  {pelerins.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.numero_id})</option>)}
                </select>
              </div>
              <div className={styles.champ}>
                <label>{t("date")}</label>
                <input type="date" value={valeurs.date_decaissement} onChange={(e) => majChamp("date_decaissement", e.target.value)} required />
              </div>
              <div className={styles.champ}>
                <label>{t("notes")}</label>
                <textarea rows={2} value={valeurs.notes} onChange={(e) => majChamp("notes", e.target.value)} />
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

export default PageDecaissement;