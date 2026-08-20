import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Search } from "lucide-react";
import { pelerinService } from "../../services/pelerinService";
import { groupeService } from "../../services/groupeService";
import styles from "../../theme/components/ModalAjoutPelerinsGroupe.module.css";

function ModalAjoutPelerinsGroupe({ groupeId, onFermer, onAjoute }) {
  const { t } = useTranslation();
  const [pelerins, setPelerins] = useState([]);
  const [selectionnes, setSelectionnes] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    pelerinService.lister().then(({ data }) => {
      // On ne propose que les pèlerins pas déjà dans CE groupe précis.
      setPelerins(data.filter((p) => p.groupe !== groupeId && String(p.groupe) !== String(groupeId)));
      setChargement(false);
    });
  }, [groupeId]);

  const basculer = (id) => {
    setSelectionnes((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const pelerinsFiltres = pelerins.filter((p) => {
    const texte = `${p.prenom} ${p.nom} ${p.numero_id}`.toLowerCase();
    return texte.includes(recherche.toLowerCase());
  });

  const valider = async () => {
    if (selectionnes.length === 0) return;
    setEnvoi(true);
    try {
      await groupeService.affecterPelerins(groupeId, selectionnes);
      onAjoute();
      onFermer();
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.superposition} onClick={onFermer}>
      <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={styles.entete}>
          <h2 className={styles.titre}>{t("ajouter_pelerins_groupe")}</h2>
          <button className={styles.boutonFermer} onClick={onFermer}><X size={16} /></button>
        </div>

        <div className={styles.zoneRecherche}>
          <Search size={15} className={styles.iconeRecherche} />
          <input
            type="text"
            placeholder={t("rechercher_pelerin")}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className={styles.champRecherche}
          />
        </div>

        <div className={styles.liste}>
          {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
          {!chargement && pelerinsFiltres.length === 0 && (
            <p className={styles.etatVide}>{t("aucun_pelerin_disponible")}</p>
          )}
          {!chargement && pelerinsFiltres.map((p) => (
            <label key={p.id} className={styles.ligne}>
              <input
                type="checkbox"
                checked={selectionnes.includes(p.id)}
                onChange={() => basculer(p.id)}
              />
              <span className={styles.idPelerin}>{p.numero_id}</span>
              <span>{p.prenom} {p.nom}</span>
            </label>
          ))}
        </div>

        <div className={styles.pied}>
          <span className={styles.compteur}>{selectionnes.length} {t("selectionnes")}</span>
          <button className={styles.boutonPrincipal} onClick={valider} disabled={envoi || selectionnes.length === 0}>
            {envoi ? t("enregistrement") : t("ajouter")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAjoutPelerinsGroupe;