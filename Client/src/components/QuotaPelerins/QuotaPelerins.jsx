import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import CONFIG from "../../config/config";

const COULEURS = {
  disponible: { fond: "#ECFDF5", texte: "#047857", bordure: "#A7F3D0" },
  atteint: { fond: "#FEF2F2", texte: "#B91C1C", bordure: "#FECACA" },
  indefini: { fond: "#F3F4F6", texte: "#4B5563", bordure: "#E5E7EB" },
};

const styleCarte = {
  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
  padding: "14px 18px", marginBottom: 18,
};
const styleBouton = {
  border: "1px solid #D1D5DB", background: "#fff", borderRadius: 8,
  padding: "8px 14px", fontSize: 13, cursor: "pointer",
};
const styleBoutonPrincipal = { ...styleBouton, background: "#0F172A", color: "#fff", border: "1px solid #0F172A" };
const styleSuperposition = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const stylePanneau = {
  background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480,
  maxHeight: "90vh", overflowY: "auto",
};

export const MESSAGE_QUOTA_DEFAUT =
  "Vous avez atteint le nombre maximal de pèlerins autorisé. Pour enregistrer un nouveau pèlerin, veuillez d'abord modifier le quota dans les paramètres.";

// Fenêtre d'alerte réutilisée par la liste et par le formulaire d'inscription.
export function AlerteQuotaAtteint({ onFermer, libelleBouton }) {
  const { t } = useTranslation();
  return (
    <div style={styleSuperposition} onClick={onFermer}>
      <div style={{ ...stylePanneau, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ margin: "8px 0", color: "#B91C1C" }}>{t("quota_atteint_titre", "QUOTA ATTEINT !")}</h2>
        <p style={{ color: "#374151", lineHeight: 1.5 }}>{t("quota_atteint_message", MESSAGE_QUOTA_DEFAUT)}</p>
        <button style={styleBoutonPrincipal} onClick={onFermer}>
          {libelleBouton || t("compris", "Compris")}
        </button>
      </div>
    </div>
  );
}

function formaterDate(iso) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * Bandeau de suivi du quota d'inscription d'un module (hajj ou oumra).
 * Props : activite ("hajj" | "oumra"), onChange(etat) appelé à chaque mise à jour,
 * version (nombre à incrémenter pour forcer un rechargement).
 */
function QuotaPelerins({ activite, onChange, version = 0 }) {
  const { t } = useTranslation();
  const [etat, setEtat] = useState(null);
  const [erreurChargement, setErreurChargement] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [valeur, setValeur] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const appliquer = (donnees) => {
    setEtat(donnees);
    if (onChange) onChange(donnees);
  };

  useEffect(() => {
    let actif = true;
    setErreurChargement(false);
    api
      .get(`${CONFIG.API_PELERINS}quota/`, { params: { activite } })
      .then(({ data }) => { if (actif) appliquer(data); })
      .catch(() => { if (actif) setErreurChargement(true); });
    return () => { actif = false; };
  }, [activite, version]);

  const ouvrirModal = () => {
    setValeur(etat?.quota ?? "");
    setConfirmation(false);
    setErreur("");
    setModalOuverte(true);
  };

  const demanderConfirmation = () => {
    const nombre = Number(valeur);
    if (!Number.isInteger(nombre) || nombre < 1) {
      setErreur(t("quota_nombre_invalide", "Saisissez un nombre entier supérieur ou égal à 1."));
      return;
    }
    if (nombre < (etat?.inscrits ?? 0)) {
      setErreur(`${t("quota_inferieur_inscrits", "Le quota ne peut pas être inférieur au nombre de pèlerins déjà inscrits")} (${etat.inscrits}).`);
      return;
    }
    setErreur("");
    setConfirmation(true);
  };

  const enregistrer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const { data } = await api.post(`${CONFIG.API_PELERINS}quota/`, { activite, quota: Number(valeur) });
      appliquer(data);
      setModalOuverte(false);
    } catch (err) {
      setConfirmation(false);
      setErreur(err.response?.data?.erreur || t("erreur_enregistrement", "Erreur lors de l'enregistrement."));
    } finally {
      setEnvoi(false);
    }
  };

  if (erreurChargement) return null;
  if (!etat) return null;

  const statut = etat.quota === null ? "indefini" : etat.atteint ? "atteint" : "disponible";
  const couleur = COULEURS[statut];
  const libelleStatut =
    statut === "indefini"
      ? t("quota_non_defini", "Quota non défini")
      : statut === "atteint"
        ? t("quota_statut_atteint", "Quota atteint")
        : t("quota_statut_disponible", "Places disponibles");
  const pourcentage = etat.quota ? Math.min(100, Math.round((etat.inscrits / etat.quota) * 100)) : 0;

  const bloc = (libelle, valeurAffichee) => (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{libelle}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{valeurAffichee}</div>
    </div>
  );

  return (
    <div style={styleCarte}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {bloc(t("quota_total", "Quota total"), etat.quota ?? "—")}
          {bloc(t("quota_inscrits", "Déjà inscrits"), etat.inscrits)}
          {bloc(t("quota_restantes", "Places restantes"), etat.restantes ?? "—")}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            background: couleur.fond, color: couleur.texte, border: `1px solid ${couleur.bordure}`,
            borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 600,
          }}>
            {libelleStatut}
          </span>
          {etat.peut_modifier && (
            <button style={styleBouton} onClick={ouvrirModal}>
              {etat.quota === null ? t("quota_definir", "Définir le quota") : t("quota_modifier", "Modifier le quota")}
            </button>
          )}
        </div>
      </div>

      {etat.quota !== null && (
        <div style={{ marginTop: 12, height: 8, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pourcentage}%`, height: "100%", background: etat.atteint ? "#DC2626" : "#059669" }} />
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
        {t("quota_annee", "Campagne")} {etat.annee} — {t("quota_remise_zero", "le quota repart à zéro chaque année")}
      </div>

      {modalOuverte && (
        <div style={styleSuperposition} onClick={() => setModalOuverte(false)}>
          <div style={stylePanneau} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{t("quota_parametres", "Quota d'inscription")} — {activite === "hajj" ? "Hajj" : "Omra"} {etat.annee}</h2>

            {!confirmation ? (
              <>
                <label style={{ fontSize: 13, color: "#374151" }}>{t("quota_nouveau", "Nombre total de pèlerins autorisé")}</label>
                <input
                  type="number" min="1" step="1" value={valeur}
                  onChange={(e) => setValeur(e.target.value)}
                  style={{ display: "block", width: "100%", padding: 10, margin: "6px 0 12px", border: "1px solid #D1D5DB", borderRadius: 8, boxSizing: "border-box" }}
                />
                <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>
                  {t("quota_deja_inscrits", "Déjà inscrits cette année")} : {etat.inscrits}
                </p>
              </>
            ) : (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 14, margin: "8px 0 12px" }}>
                <strong>{t("quota_confirmer", "Confirmer la modification ?")}</strong>
                <p style={{ margin: "6px 0 0", color: "#374151" }}>
                  {t("quota_ancien", "Ancien quota")} : <strong>{etat.quota ?? "—"}</strong> → {t("quota_nouveau_court", "Nouveau quota")} : <strong>{valeur}</strong>
                </p>
              </div>
            )}

            {erreur && <p style={{ color: "#B91C1C", fontSize: 13 }}>{erreur}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                style={styleBouton}
                onClick={() => (confirmation ? setConfirmation(false) : setModalOuverte(false))}
              >
                {confirmation ? t("precedent", "Précédent") : t("annuler", "Annuler")}
              </button>
              {!confirmation ? (
                <button style={styleBoutonPrincipal} onClick={demanderConfirmation}>{t("continuer", "Continuer")}</button>
              ) : (
                <button style={styleBoutonPrincipal} onClick={enregistrer} disabled={envoi}>
                  {envoi ? t("enregistrement", "Enregistrement…") : t("confirmer", "Confirmer")}
                </button>
              )}
            </div>

            <h3 style={{ fontSize: 14, margin: "20px 0 8px" }}>{t("quota_historique", "Historique des modifications")}</h3>
            {etat.historique.length === 0 ? (
              <p style={{ fontSize: 13, color: "#6B7280" }}>{t("quota_historique_vide", "Aucune modification enregistrée.")}</p>
            ) : (
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6B7280" }}>
                    <th style={{ padding: "4px 6px" }}>{t("date", "Date")}</th>
                    <th style={{ padding: "4px 6px" }}>{t("quota_ancien", "Ancien quota")}</th>
                    <th style={{ padding: "4px 6px" }}>{t("quota_nouveau_court", "Nouveau quota")}</th>
                    <th style={{ padding: "4px 6px" }}>{t("utilisateur", "Utilisateur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {etat.historique.map((h, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "4px 6px" }}>{formaterDate(h.date)}</td>
                      <td style={{ padding: "4px 6px" }}>{h.ancien_quota ?? "—"}</td>
                      <td style={{ padding: "4px 6px" }}>{h.nouveau_quota}</td>
                      <td style={{ padding: "4px 6px" }}>{h.utilisateur || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotaPelerins;