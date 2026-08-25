import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { documentsGeneresService } from "../../services/documentsGeneresService";
import styles from "../../theme/pages/modeles-documents/PageModelesDocuments.module.css";

const CHAMPS_INSERABLES = [
  { cle: "prenom", balise: "{{ p.prenom }}", exemple: "Amadou" },
  { cle: "nom", balise: "{{ p.nom }}", exemple: "Diallo" },
  { cle: "numero_dossier", balise: "{{ p.numero_id }}", exemple: "BVG-001-P26" },
  { cle: "numero_passeport", balise: "{{ p.numero_passeport }}", exemple: "PA1234567" },
  { cle: "type_voyage", balise: "{{ p.get_type_voyage_display }}", exemple: "Pèlerinage (Hajj)" },
  { cle: "montant_verse", balise: "{{ p.montant_total_verse }}", exemple: "5 000 000" },
  { cle: "groupe_sanguin", balise: "{{ p.groupe_sanguin }}", exemple: "O+" },
  { cle: "date_du_jour", balise: "{{ aujourdhui }}", exemple: "26/08/2026" },
];

const MODULES_EDITEUR = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

function PageModelesDocuments() {
  const { t } = useTranslation();
  const [modeles, setModeles] = useState([]);
  const [modeleActif, setModeleActif] = useState(null);
  const [contenu, setContenu] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [modeApercu, setModeApercu] = useState(false);
  const editeurRef = useRef(null);

  const charger = () => {
    documentsGeneresService.listerModeles().then(({ data }) => {
      setModeles(data);
      setChargement(false);
      if (data.length > 0 && !modeleActif) {
        setModeleActif(data[0].type_document);
        setContenu(data[0].corps_html);
      }
    });
  };

  useEffect(() => { charger(); }, []);

  const selectionner = (m) => {
    setModeleActif(m.type_document);
    setContenu(m.corps_html);
    setMessage("");
    setModeApercu(false);
  };

  const inserer = (balise) => {
    const editeur = editeurRef.current?.getEditor();
    if (!editeur) return;
    const position = editeur.getSelection()?.index ?? editeur.getLength();
    editeur.insertText(position, ` ${balise} `);
    editeur.setSelection(position + balise.length + 2);
  };

  const enregistrer = async () => {
    setEnvoi(true);
    setMessage("");
    try {
      await documentsGeneresService.modifierModele(modeleActif, { corps_html: contenu });
      setMessage(t("modele_enregistre"));
      charger();
    } catch {
      setMessage(t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  const genererApercu = () => {
    let texte = contenu;
    CHAMPS_INSERABLES.forEach((c) => {
      texte = texte.split(c.balise).join(`<strong style="color:#0B3FA0">${c.exemple}</strong>`);
    });
    // Simplifie les boucles Django pour l'aperçu (juste informatif)
    texte = texte.replace(/{%.*?%}/g, "");
    return texte;
  };

  if (chargement) return <p className={styles.chargement}>{t("chargement")}</p>;

  const modeleCourant = modeles.find((m) => m.type_document === modeleActif);

  return (
    <div>
      <h1 className={styles.titre}>{t("menu_modeles_documents")}</h1>
      <p className={styles.sousTitre}>{t("modeles_documents_description_simple")}</p>

      <div className={styles.onglets}>
        {modeles.map((m) => (
          <button
            key={m.type_document}
            className={modeleActif === m.type_document ? styles.ongletActif : styles.onglet}
            onClick={() => selectionner(m)}
          >
            {m.titre}
          </button>
        ))}
      </div>

      {modeleCourant && (
        <div className={styles.carte}>
          <div className={styles.enteteOutils}>
            <p className={styles.labelOutils}>{t("cliquer_pour_inserer")}</p>
            <div className={styles.boutonsChamps}>
              {CHAMPS_INSERABLES.map((c) => (
                <button key={c.cle} className={styles.boutonChamp} onClick={() => inserer(c.balise)} type="button">
                  + {t(`champ_${c.cle}`)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.bascule}>
            <button
              className={!modeApercu ? styles.basculeActive : styles.basculeInactive}
              onClick={() => setModeApercu(false)}
            >
              {t("mode_edition")}
            </button>
            <button
              className={modeApercu ? styles.basculeActive : styles.basculeInactive}
              onClick={() => setModeApercu(true)}
            >
              {t("mode_apercu")}
            </button>
          </div>

          {!modeApercu ? (
            <div className={styles.zoneEditeur}>
              <ReactQuill
                ref={editeurRef}
                theme="snow"
                value={contenu}
                onChange={setContenu}
                modules={MODULES_EDITEUR}
              />
            </div>
          ) : (
            <div className={styles.zoneApercu}>
              <p className={styles.avertissementApercu}>{t("avertissement_apercu")}</p>
              <div className={styles.papierApercu} dangerouslySetInnerHTML={{ __html: genererApercu() }} />
            </div>
          )}

          {message && <p className={styles.message}>{message}</p>}

          <div className={styles.navigation}>
            <button className={styles.boutonPrincipal} onClick={enregistrer} disabled={envoi}>
              {envoi ? t("enregistrement") : t("enregistrer")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageModelesDocuments;