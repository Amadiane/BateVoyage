import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Search } from "lucide-react";
import { pelerinService } from "../../services/pelerinService";
import { chambreService } from "../../services/chambreService";
import styles from "../../theme/components/ModalAjoutPelerinsGroupe.module.css";

function ModalAjoutPelerinsChambre({ chambreId, placesRestantes, onFermer, onAjoute }) {
  const { t } = useTranslation();
  const [pelerins, setPelerins] = useState([]);
  const [selectionnes, setSelectionnes] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    pelerinService.lister().then(({ data }) => {
      setPelerins(data.filter((p) => String(p.chambre) !== String(chambreId)));
      setChargement(false);
    });
  }, [chambreId]);

  const basculer = (id) => {
    setSelectionnes((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= placesRestantes) return s; // bloque au-delà de la capacité
      return [...s, id];
    });
  };

  const pelerinsFiltres = pelerins.filter((p) => {
    const texte = `${p.prenom} ${p.nom} ${p.numero_id}`.toLowerCase();
    return texte.includes(recherche.toLowerCase());
  });

  const valider = async () => {
    if (selectionnes.length === 0) return;
    setEnvoi(true);
    setErreur("");
    try {
      await chambreService.affecterPelerins(chambreId, selectionnes);
      onAjoute();
      onFermer();
    } catch (err) {
      setErreur(err.response?.data?.erreur || t("erreur_enregistrement"));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className={styles.superposition} onClick={onFermer}>
      <div className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={styles.entete}>
          <h2 className={styles.titre}>{t("ajouter_pelerins_chambre")}</h2>
          <button className={styles.boutonFermer} onClick={onFermer}><X size={16} /></button>
        </div>

        <p className={styles.capaciteInfo}>{t("places_restantes")} : {placesRestantes - selectionnes.length}</p>

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
          {!chargement && pelerinsFiltres.length === 0 && <p className={styles.etatVide}>{t("aucun_pelerin_disponible")}</p>}
          {!chargement && pelerinsFiltres.map((p) => {
            const desactive = !selectionnes.includes(p.id) && selectionnes.length >= placesRestantes;
            return (
              <label key={p.id} className={styles.ligne} style={desactive ? { opacity: 0.4, cursor: "not-allowed" } : {}}>
                <input
                  type="checkbox"
                  checked={selectionnes.includes(p.id)}
                  onChange={() => basculer(p.id)}
                  disabled={desactive}
                />
                <span className={styles.idPelerin}>{p.numero_id}</span>
                <span>{p.prenom} {p.nom}</span>
              </label>
            );
          })}
        </div>

        {erreur && <p className={styles.erreurModal}>{erreur}</p>}

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

export default ModalAjoutPelerinsChambre;