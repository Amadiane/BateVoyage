import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { personnelService } from "../../services/personnelService";
import { utilisateurService } from "../../services/utilisateurService";
import styles from "../../theme/pages/personnel/ListePersonnel.module.css";

const ROLES_PERSONNEL = ["guide", "encadreur", "docteur", "mounazim"];

function ListePersonnel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fiches, setFiches] = useState([]);
  const [comptesSansFiche, setComptesSansFiche] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreRole, setFiltreRole] = useState("");

  const charger = async () => {
    setChargement(true);
    try {
      const params = {};
      if (filtreRole) params.utilisateur__role = filtreRole;
      const { data } = await personnelService.lister(params);
      setFiches(data);

      const { data: tousComptes } = await utilisateurService.listerComptes();
      const idsAvecFiche = new Set(data.map((f) => f.utilisateur));
      setComptesSansFiche(
        tousComptes.filter((u) => ROLES_PERSONNEL.includes(u.role) && !idsAvecFiche.has(u.id))
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, [filtreRole]);

  return (
    <div>
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>{t("menu_personnel")}</h1>
          <p className={styles.sousTitre}>{fiches.length} {t("fiches_enregistrees")}</p>
        </div>
      </div>

      {comptesSansFiche.length > 0 && (
        <div className={styles.alerteComptesSansFiche}>
          <p className={styles.texteAlerte}>{t("comptes_sans_fiche")} :</p>
          <div className={styles.listeComptesSansFiche}>
            {comptesSansFiche.map((u) => (
              <button key={u.id} className={styles.boutonCompteSansFiche} onClick={() => navigate(`/personnel/nouveau?utilisateur=${u.id}`)}>
                + {u.first_name} {u.last_name} ({u.role_display})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.barreOutils}>
        <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)} className={styles.selectFiltre}>
          <option value="">{t("tous_les_roles")}</option>
          <option value="guide">{t("role_guide")}</option>
          <option value="encadreur">{t("role_encadreur")}</option>
          <option value="docteur">{t("role_docteur")}</option>
          <option value="mounazim">{t("role_mounazim")}</option>
        </select>
      </div>

      <div className={styles.grilleCartes}>
        {chargement && <p className={styles.etatVide}>{t("chargement")}</p>}
        {!chargement && fiches.length === 0 && <p className={styles.etatVide}>{t("aucune_fiche")}</p>}
        {!chargement && fiches.map((f) => (
          <div key={f.id} className={styles.carte} onClick={() => navigate(`/personnel/${f.id}`)}>
            <div className={styles.bandeau}>
              {f.utilisateur_photo ? (
                <img src={f.utilisateur_photo} alt="" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>{f.utilisateur_nom?.[0]}</div>
              )}
              <div>
                <p className={styles.nom}>{f.utilisateur_nom}</p>
                <span className={styles.badgeRole}>{f.utilisateur_role_display}</span>
              </div>
            </div>
            <p className={styles.matricule}>{f.matricule}</p>
            <div className={styles.infosLigne}>
              <span className={f.disponibilite === "actif" ? styles.badgeVert : styles.badgeGris}>
                {f.disponibilite_display}
              </span>
              {f.nombre_saisons_experience > 0 && (
                <span className={styles.experience}>{f.nombre_saisons_experience} {t("saisons")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListePersonnel;