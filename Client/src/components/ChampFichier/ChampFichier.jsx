import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../theme/components/ChampFichier.module.css";

function estImage(nomOuUrl) {
  return /\.(jpe?g|png|gif|webp)$/i.test(nomOuUrl || "");
}

function ChampFichier({ label, valeurActuelle, onFichierChange, accept = "image/*,.pdf" }) {
  const { t } = useTranslation();
  const [nouveauFichier, setNouveauFichier] = useState(null);
  const [apercuNouveau, setApercuNouveau] = useState(null);

  const handleChange = (e) => {
    const fichier = e.target.files[0] || null;
    setNouveauFichier(fichier);
    setApercuNouveau(fichier ? URL.createObjectURL(fichier) : null);
    onFichierChange(fichier);
  };

  const afficherImage = nouveauFichier
    ? estImage(nouveauFichier.name)
    : estImage(valeurActuelle);

  const urlApercu = apercuNouveau || valeurActuelle;

  return (
    <div className={styles.champ}>
      <label className={styles.label}>{label}</label>

      <div className={styles.zone}>
        {urlApercu && afficherImage ? (
          <img src={urlApercu} alt="" className={styles.miniature} />
        ) : urlApercu ? (
          <div className={styles.iconeDocument}>📄</div>
        ) : (
          <div className={styles.iconeVide}>—</div>
        )}

        <div className={styles.infos}>
          {nouveauFichier ? (
            <p className={styles.nomFichier}>{nouveauFichier.name}</p>
          ) : valeurActuelle ? (
            <p className={styles.statutActuel}>✓ {t("document_deja_enregistre")}</p>
          ) : (
            <p className={styles.statutVide}>{t("aucun_document")}</p>
          )}

          <label className={styles.boutonParcourir}>
            {valeurActuelle || nouveauFichier ? t("remplacer_fichier") : t("choisir_fichier")}
            <input type="file" accept={accept} onChange={handleChange} hidden />
          </label>
        </div>
      </div>
    </div>
  );
}

export default ChampFichier;