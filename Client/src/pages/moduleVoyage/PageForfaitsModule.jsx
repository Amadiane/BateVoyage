import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, X, Download, Trash2, Pencil } from "lucide-react";
import { forfaitService } from "../../services/forfaitService";
import { telechargerFichierProtege } from "../../utils/telechargement";
import styles from "../../theme/pages/moduleVoyage/PageForfaitsModule.module.css";

const PRESTATIONS_TOUJOURS = ["Billet d'avion", "Visa", "Hôtel Makkah", "Hôtel Médine", "Restauration", "Transport"];
const PRESTATIONS_HAJJ_UNIQUEMENT = ["Services Mashair", "Encadrement religieux", "Assistance", "Assurance", "Bagages", "Autres prestations"];

const VALEURS_INITIALES = {
  nom: "", standard: "", annee: new Date().getFullYear(), prix_vente: "", cout_reel: "", nombre_places: "",
};

function genererLignesParDefaut(typeVoyage) {
  const libelles = typeVoyage === "pelerinage"
    ? [...PRESTATIONS_TOUJOURS, ...PRESTATIONS_HAJJ_UNIQUEMENT]
    : PRESTATIONS_TOUJOURS;
  return libelles.map((libelle) => ({ libelle, montant: "" }));
}

function PageForfaitsModule({ typeVoyage, basePath }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [forfaits, setForfaits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [forfaitAModifier, setForfaitAModifier] = useState(null);
  const [valeurs, setValeurs] = useState(VALEURS_INITIALES);
  const [lignes, setLignes] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true);
    forfaitService.lister({ type_voyage: typeVoyage }).then(({ data }) => {
      setForfaits(data);
      setChargement(false);
    });
  };

  useEffect(() => { charger(); }, [typeVoyage]);

  const ouvrirNouveau = () => {
    setForfaitAModifier(null);
    setValeurs(VALEURS_INITIALES);
    setLignes(genererLignesParDefaut(typeVoyage));
    setErreur("");
    setModalOuverte(true);
  };

  const ouvrirModification = (f) => {
    setForfaitAModifier(f);
    setValeurs({
      nom: f.nom, standard: f.standard, annee: f.annee, prix_vente: f.prix_vente,
      cout_reel: f.cout_reel, nombre_places: f.nombre_places,
    });
    setLignes(f.lignes.length > 0 ? f.lignes.map((l) => ({ libelle: l.libelle, montant: l.montant })) : genererLignesParDefaut(typeVoyage));
    setErreur("");
    setModalOuverte(true);
  };

  const majChamp = (champ, val) => setValeurs((v) => ({ ...v, [champ]: val }));

  const majLigne = (index, champ, val) => {
    setLignes((liste) => liste.map((l, i) => (i === index ? { ...l, [champ]: val } : l)));
  };

  const ajouterLigne = () => setLignes((liste) => [...liste, { libelle: "", montant: "" }]);
  const retirerLigne = (index) => setLignes((liste) => liste.filter((_, i) => i !== index));

  const totalLignes = lignes.reduce((s, l) => s + (parseInt(l.montant) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const donnees = {
        ...valeurs,
        type_voyage: typeVoyage,
        lignes: lignes
          .filter((l) => l.libelle.trim())
          .map((l) => ({ libelle: l.libelle, montant: parseInt(l.montant) || 0 })),
      };
      if (forfaitAModifier) {
        await forfaitService.modifier(forfaitAModifier.id, donnees);
      } else {
        await forfaitService.creer(donnees);
      }
      setModalOuverte(false);
      charger();
    } catch {
      setErreur(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm(t("confirmer_suppression"))) return;
    await forfaitService.supprimer(id);
    charger();
  };

  const exporterPdf = (f) => {
    telechargerFichierProtege(forfaitService.urlExportPdf(f.id), `devis_${f.nom}.pdf`);
  };

  return (
    <div>
      <button className={styles.retour} onClick={() => navigate(basePath)}>← {t("retour")}</button>

      <div className={styles.entete}>
        <h1 className={styles.titre}>{t("sous_module_forfaits")}</h1>
        <button className={styles.boutonPrincipal} onClick={ouvrirNouveau}>
          <Plus size={16} /> {t("nouveau_forfait")}
        </button>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && forfaits.length === 0 && <p className={styles.etatVide}>{t("aucun_forfait")}</p>}
        {!chargement && forfaits.map((f) => (
          <div key={f.id} className={`${styles.carte} ${styles["bordure_" + f.standard]}`}>
            <div className={styles.bandeau}>
              <span className={`${styles.badge} ${styles["badge_" + f.standard]}`}>{f.standard_display}</span>
              <div className={styles.actions}>
                <button onClick={() => ouvrirModification(f)} title={t("modifier")}><Pencil size={13} /></button>
                <button onClick={() => supprimer(f.id)} title={t("supprimer")} className={styles.boutonSupprimer}><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 className={styles.nom}>{f.nom}</h3>
            <p className={styles.prix}>{parseInt(f.total_lignes).toLocaleString("fr-FR")} GNF</p>
            <p className={styles.sousLibelleTotal}>{t("total_devis")}</p>
            <div className={styles.detailsInternes}>
              <span>{t("prix_vente")} : {parseInt(f.prix_vente).toLocaleString("fr-FR")} GNF</span>
              <span>{t("cout_reel")} : {parseInt(f.cout_reel).toLocaleString("fr-FR")} GNF</span>
              <span className={f.marge >= 0 ? styles.margePositive : styles.margeNegative}>
                {t("marge")} : {parseInt(f.marge).toLocaleString("fr-FR")} GNF
              </span>
            </div>
            <p className={styles.places}>{f.nombre_places} {t("places_disponibles")}</p>
            <button className={styles.boutonExport} onClick={() => exporterPdf(f)}>
              <Download size={14} /> {t("exporter_pdf")}
            </button>
          </div>
        ))}
      </div>

      {modalOuverte && (
        <div className={styles.superposition} onClick={() => setModalOuverte(false)}>
          <div className={styles.panneauLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.enteteModal}>
              <h2>{forfaitAModifier ? t("modifier_forfait") : t("nouveau_forfait")}</h2>
              <button className={styles.boutonFermer} onClick={() => setModalOuverte(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.formulaire}>
              <div className={styles.champ}>
                <label>{t("nom_forfait")}</label>
                <input value={valeurs.nom} onChange={(e) => majChamp("nom", e.target.value)} required placeholder="Hajj VIP 2027" />
              </div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("standard")}</label>
                  <select value={valeurs.standard} onChange={(e) => majChamp("standard", e.target.value)} required>
                    <option value="">—</option>
                    <option value="vip">VIP</option>
                    <option value="semi_vip">Semi-VIP</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
                <div className={styles.champ}>
                  <label>{t("annee")}</label>
                  <input type="number" value={valeurs.annee} onChange={(e) => majChamp("annee", e.target.value)} required />
                </div>
              </div>

              <div className={styles.sectionTitre}>{t("detail_prestations")}</div>
              <div className={styles.tableauLignes}>
                {lignes.map((ligne, index) => (
                  <div key={index} className={styles.ligneEditable}>
                    <input
                      className={styles.inputLibelle}
                      value={ligne.libelle}
                      onChange={(e) => majLigne(index, "libelle", e.target.value)}
                      placeholder={t("nom_prestation")}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.inputMontant}
                      value={ligne.montant}
                      onChange={(e) => majLigne(index, "montant", e.target.value)}
                      placeholder="0"
                    />
                    <button type="button" className={styles.boutonRetirerLigne} onClick={() => retirerLigne(index)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" className={styles.boutonAjouterLigne} onClick={ajouterLigne}>
                  <Plus size={14} /> {t("ajouter_prestation")}
                </button>
              </div>

              <div className={styles.totalDevis}>
                <span>{t("total_devis")}</span>
                <strong>{totalLignes.toLocaleString("fr-FR")} GNF</strong>
              </div>

              <div className={styles.sectionTitre}>{t("infos_internes_agence")}</div>
              <div className={styles.ligneDeux}>
                <div className={styles.champ}>
                  <label>{t("prix_vente")} (GNF)</label>
                  <input type="number" min="0" value={valeurs.prix_vente} onChange={(e) => majChamp("prix_vente", e.target.value)} required />
                </div>
                <div className={styles.champ}>
                  <label>{t("cout_reel")} (GNF)</label>
                  <input type="number" min="0" value={valeurs.cout_reel} onChange={(e) => majChamp("cout_reel", e.target.value)} required />
                </div>
              </div>
              <div className={styles.champ}>
                <label>{t("nombre_places")}</label>
                <input type="number" min="0" value={valeurs.nombre_places} onChange={(e) => majChamp("nombre_places", e.target.value)} required />
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
    </div>
  );
}

export default PageForfaitsModule;