import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { utilisateurService } from "../../services/utilisateurService";
import styles from "../../theme/pages/utilisateurs/ListeUtilisateurs.module.css";

const ROLES = [
  "fondateur", "admin_general", "comptable", "secretaire", "docteur",
  "traducteur", "affaires_sociales", "guide", "encadreur", "mounazim", "pelerin",
];

function ListeUtilisateurs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("");

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (recherche) params.search = recherche;
      if (filtreRole) params.role = filtreRole;
      const { data } = await utilisateurService.listerComptes(params);
      setUtilisateurs(data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    const delai = setTimeout(charger, 300);
    return () => clearTimeout(delai);
  }, [recherche, filtreRole]);

  const supprimer = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("confirmer_suppression_utilisateur"))) return;
    await utilisateurService.supprimerCompte(id);
    charger();
  };

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_utilisateurs")}</h1>
          <p className={styles.sousTitre}>{utilisateurs.length} {t("comptes_enregistres")}</p>
        </div>
        <button className={styles.boutonPrincipal} onClick={() => navigate("/utilisateurs/nouveau")}>
          + {t("nouveau_utilisateur")}
        </button>
      </div>

      <div className={styles.barreOutils}>
        <input
          type="text"
          placeholder={t("rechercher_utilisateur")}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className={styles.champRecherche}
        />
        <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_roles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{t(`role_${r}`)}</option>
          ))}
        </select>
      </div>

      <div className={styles.conteneurTableau}>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th>{t("photo")}</th>
              <th>{t("nom_complet")}</th>
              <th>{t("nom_utilisateur_champ")}</th>
              <th>{t("role")}</th>
              <th>{t("telephone")}</th>
              <th>{t("statut")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={7} className={styles.etatVide}>{t("chargement")}</td></tr>
            )}
            {!chargement && utilisateurs.length === 0 && (
              <tr><td colSpan={7} className={styles.etatVide}>{t("aucun_utilisateur")}</td></tr>
            )}
            {!chargement && utilisateurs.map((u) => (
              <tr key={u.id} className={styles.ligneCliquable} onClick={() => navigate(`/utilisateurs/${u.id}/modifier`)}>
                <td>
                  {u.photo ? (
                    <img src={u.photo} alt="" className={styles.miniature} />
                  ) : (
                    <div className={styles.miniaturePlaceholder}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                  )}
                </td>
                <td>{u.first_name} {u.last_name}</td>
                <td className={styles.cellUsername}>@{u.username}</td>
                <td>
                  <span className={`${styles.badgeRole} ${styles["role_" + u.role]}`}>
                    {u.role_display}
                  </span>
                </td>
                <td>{u.telephone || "—"}</td>
                <td>
                  <span className={u.actif ? styles.badgeActif : styles.badgeInactif}>
                    {u.actif ? t("actif") : t("inactif")}
                  </span>
                </td>
                <td className={styles.cellActions} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/utilisateurs/${u.id}/modifier`)} title={t("modifier")}>✎</button>
                  <button onClick={(e) => supprimer(u.id, e)} title={t("supprimer")} className={styles.boutonSupprimer}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListeUtilisateurs;