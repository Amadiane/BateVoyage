import { useTranslation } from "react-i18next";

/* ------------------------------------------------------------------ */
/*  Palette et styles partagés (inline : aucune dépendance CSS)        */
/* ------------------------------------------------------------------ */
const C = {
  encre: "#0F172A",
  texte: "#1F2937",
  discret: "#6B7280",
  bordure: "#E7E2D6",
  fond: "#FAF8F3",
  carte: "#FFFFFF",
  or: "#B8923A",
  orClair: "#F6EEDB",
  positif: "#047857",
  negatif: "#B91C1C",
  // Teintes par type de ligne (Tableau 2)
  partFond: "#EFF6FF", partTexte: "#1E3A8A", partBord: "#3B82F6",
  detteFond: "#FEF2F2", detteTexte: "#B91C1C", detteBord: "#EF4444",
  netFond: "#ECFDF5", netTexte: "#047857", netBord: "#10B981",
};

const styleCarte = {
  background: C.carte, border: `1px solid ${C.bordure}`, borderRadius: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)", marginBottom: 18, overflow: "hidden",
};

/* ------------------------------------------------------------------ */
/*  Utilitaires d'affichage                                            */
/* ------------------------------------------------------------------ */
const propre = (v) => (Math.abs(v) < 0.005 ? 0 : v);
const fmtGnf = (v) => Math.round(propre(v)).toLocaleString("fr-FR");
const fmtDev = (v) =>
  propre(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const couleurMontant = (v) => (v < 0 ? C.negatif : C.texte);

const somme = (liste) =>
  liste.reduce(
    (t, v) => (v ? { gnf: t.gnf + v.gnf, usd: t.usd + v.usd, sar: t.sar + v.sar } : t),
    { gnf: 0, usd: 0, sar: 0 }
  );

function initiales(nom) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");
}

/* Styles de tableau : une colonne par monnaie */
const styleTable = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
// Tableaux des associés : colonnes de largeur identique d'un bloc à l'autre
const styleTableFixe = { ...styleTable, tableLayout: "fixed" };
const Colonnes = () => (
  <colgroup>
    <col style={{ width: "31%" }} />
    <col style={{ width: "25%" }} />
    <col style={{ width: "22%" }} />
    <col style={{ width: "22%" }} />
  </colgroup>
);
const styleTh = {
  textAlign: "right", fontSize: 11, fontWeight: 700, color: C.encre, textTransform: "uppercase",
  letterSpacing: 0.4, padding: "9px 10px", background: "#F1F5F9", borderBottom: `2px solid ${C.or}`, whiteSpace: "nowrap",
};
const styleThGauche = { ...styleTh, textAlign: "left" };
// En-tête sombre (Tableau 1)
const styleThSombre = { background: C.encre, color: "#fff", borderBottom: `2px solid ${C.or}` };
const styleTd = { textAlign: "right", padding: "9px 10px", borderBottom: `1px solid ${C.bordure}`, whiteSpace: "nowrap" };
const styleTdGauche = { ...styleTd, textAlign: "left", whiteSpace: "normal", color: C.texte };

function EnteteMonnaies({ premier = "" }) {
  const { t } = useTranslation();
  return (
    <tr>
      <th style={styleThGauche}>{premier}</th>
      <th style={styleTh}>GNF</th>
      <th style={styleTh}>USD</th>
      <th style={styleTh}>
        SAR
        <div style={{ fontSize: 9, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
          {t("riyal_saoudien", "riyal saoudien")}
        </div>
      </th>
    </tr>
  );
}

/* Trois cellules GNF / USD / SAR pour un montant { gnf, usd, sar } */
function CellulesMontant({ valeur, fort, signe, fond, couleur: couleurImposee }) {
  const style = (extra = {}) => ({ ...styleTd, background: fond || "transparent", ...extra });
  if (!valeur) {
    return (
      <>
        <td style={style({ color: C.discret })}>—</td>
        <td style={style({ color: C.discret })}>—</td>
        <td style={style({ color: C.discret })}>—</td>
      </>
    );
  }
  const couleur = couleurImposee || (signe ? (valeur.gnf < 0 ? C.negatif : C.positif) : couleurMontant(valeur.gnf));
  const poids = fort ? 800 : 600;
  return (
    <>
      <td style={style({ color: couleur, fontWeight: poids, fontSize: fort ? 15 : 14 })}>{fmtGnf(valeur.gnf)}</td>
      <td style={style({ color: couleur, fontWeight: poids })}>{fmtDev(valeur.usd)}</td>
      <td style={style({ color: couleur, fontWeight: poids })}>{fmtDev(valeur.sar)}</td>
    </>
  );
}

function Avertissements({ synthese }) {
  const { t } = useTranslation();
  const note = { fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "8px 12px", margin: "0 0 12px" };
  return (
    <>
      {synthese.perimetre_pelerins === "toutes_par_defaut" && (
        <p style={note}>
          ⚠️ {t("note_perimetre", "Aucun pèlerin n'est inscrit pendant cette saison : tous les pèlerins Hajj enregistrés sont comptés.")}
        </p>
      )}
      {synthese.pelerins_hors_groupes > 0 && (
        <p style={note}>
          ⚠️ {synthese.pelerins_hors_groupes}{" "}
          {t("pelerins_hors_groupes", "pèlerin(s) d'une autre agence ne sont comptés dans aucun groupe.")}
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tableau 1 : répartition des pèlerins par agence                    */
/* ------------------------------------------------------------------ */
export function TableauAgences({ synthese }) {
  const { t } = useTranslation();
  const groupes = synthese.groupes || [];
  const total = synthese.total_groupes;

  return (
    <div>
      <Avertissements synthese={synthese} />

      <div style={{ ...styleCarte, background: C.fond, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, color: C.discret, lineHeight: 1.5 }}>
          💡 {t(
            "aide_agences",
            "Chaque pèlerin appartient à l'agence choisie dans sa fiche (« Agence partenaire »). Sans agence choisie, il compte pour BATE VOYAGE GUINÉE. Le bénéfice de chaque agence est proportionnel à son nombre de pèlerins."
          )}
        </div>
      </div>

      <div style={styleCarte}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.bordure}`, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0, fontSize: 17, color: C.encre }}>
            {t("tableau_agences_titre", "Répartition des pèlerins par agence")}
          </h2>
          <span style={{ fontSize: 13, color: C.discret }}>
            {total ? total.nb_pelerins : 0} {t("pelerins", "pèlerins")}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styleTable}>
            <thead>
              <tr>
                <th style={{ ...styleThGauche, ...styleThSombre, padding: "10px 20px" }}>{t("agence", "Agence")}</th>
                <th style={{ ...styleTh, ...styleThSombre }}>{t("pelerins", "Pèlerins")}</th>
                <th style={{ ...styleTh, ...styleThSombre }}>%</th>
                <th style={{ ...styleTh, ...styleThSombre }}>GNF</th>
                <th style={{ ...styleTh, ...styleThSombre }}>USD</th>
                <th style={{ ...styleTh, ...styleThSombre }}>
                  SAR
                  <div style={{ fontSize: 9, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                    {t("riyal_saoudien", "riyal saoudien")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groupes.map((g, idx) => {
                const fondLigne = idx % 2 === 1 ? C.fond : "#fff";
                return (
                <tr key={g.nom} style={{ background: fondLigne }}>
                  <td style={{ ...styleTdGauche, padding: "12px 20px", minWidth: 180, borderLeft: `4px solid ${C.or}` }}>
                    <div style={{ fontWeight: 700, color: C.encre }}>{g.nom}</div>
                    <div style={{ height: 6, background: "#EFE9DA", borderRadius: 999, marginTop: 6, overflow: "hidden", maxWidth: 220 }}>
                      <div style={{ width: `${Math.min(100, g.pourcentage)}%`, height: "100%", background: C.or }} />
                    </div>
                  </td>
                  <td style={{ ...styleTd, fontWeight: 700 }}>{g.nb_pelerins}</td>
                  <td style={styleTd}>{g.pourcentage.toLocaleString("fr-FR")} %</td>
                  <CellulesMontant valeur={g.benefice} fort signe />
                </tr>
                );
              })}
              {total && (
                <tr>
                  <td style={{ ...styleTdGauche, padding: "12px 20px", fontWeight: 800, background: C.orClair, borderTop: `2px solid ${C.or}`, borderLeft: `4px solid ${C.or}` }}>{t("total", "Total")}</td>
                  <td style={{ ...styleTd, fontWeight: 800, background: C.orClair }}>{total.nb_pelerins}</td>
                  <td style={{ ...styleTd, background: C.orClair }}>100 %</td>
                  <CellulesMontant valeur={total.benefice} fort signe fond={C.orClair} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tableau 2 : répartition des bénéfices par associé                  */
/* ------------------------------------------------------------------ */
export function TableauRepartitionAssocies({ synthese }) {
  const { t } = useTranslation();
  const ligne = (cle) => synthese.lignes.find((l) => l.cle === cle)?.valeurs || [];
  const parts = ligne("part");
  const dettes = ligne("dettes");
  const nets = ligne("net");

  const associes = synthese.associes.map((a, i) => ({ ...a, part: parts[i], dette: dettes[i], net: nets[i] }));

  // Regroupement par agence en gardant l'ordre d'apparition
  const groupes = [];
  associes.forEach((a) => {
    let g = groupes.find((x) => x.nom === a.groupe);
    if (!g) {
      g = { nom: a.groupe, membres: [], info: (synthese.groupes || []).find((x) => x.nom === a.groupe) };
      groupes.push(g);
    }
    g.membres.push(a);
  });

  const totalGeneral = somme(nets);

  return (
    <div>
      {/* Sur petit écran : marges réduites pour que les 3 colonnes GNF / USD / SAR tiennent sans défilement */}
      <style>{`@media (max-width: 480px) {
        .bvg-bloc { padding-left: 10px !important; padding-right: 10px !important; }
        .bvg-tab td, .bvg-tab th { padding-left: 4px !important; padding-right: 4px !important; font-size: 12px !important; }
      }`}</style>
      <Avertissements synthese={synthese} />

      {/* Mode d'emploi pour un lecteur novice */}
      <div style={{ ...styleCarte, background: C.fond, padding: "16px 20px" }}>
        <div style={{ fontWeight: 700, color: C.encre, marginBottom: 8 }}>
          📖 {t("comment_lire", "Comment lire ce tableau")}
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, color: C.discret, fontSize: 13, lineHeight: 1.7 }}>
          <li>{t("lire_1", "Chaque agence a son propre bénéfice, selon son nombre de pèlerins.")}</li>
          <li>{t("lire_2", "Ce bénéfice est partagé entre les associés de l'agence selon leur pourcentage : c'est la « part du bénéfice ».")}</li>
          <li>{t("lire_3", "On retire ensuite les dettes de chaque associé : le résultat est le « net à recevoir ». La caisse n'a pas de dettes.")}</li>
          <li>{t("lire_4", "Les montants sont donnés colonne par colonne : GNF, USD et SAR (riyal saoudien).")}</li>
        </ol>
      </div>

      {/* Légende des couleurs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 14px" }}>
        {[
          [t("part_benefice", "Part du bénéfice"), C.partFond, C.partTexte, C.partBord],
          [t("dettes_deduire", "Dettes à déduire"), C.detteFond, C.detteTexte, C.detteBord],
          [t("net_recevoir", "Net à recevoir"), C.netFond, C.netTexte, C.netBord],
        ].map(([texte, fond, couleur, bord]) => (
          <span key={texte} style={{ background: fond, color: couleur, border: `1px solid ${bord}`, borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
            {texte}
          </span>
        ))}
      </div>

      {groupes.map((g) => {
        const totalPart = somme(g.membres.map((m) => m.part));
        const totalNet = somme(g.membres.map((m) => m.net));
        return (
          <div key={g.nom} style={styleCarte}>
            {/* En-tête de l'agence */}
            <div style={{ background: C.encre, color: "#fff", padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{g.nom}</div>
                <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 2 }}>
                  {g.info ? `${g.info.nb_pelerins} ${t("pelerins", "pèlerins")} · ${g.info.pourcentage.toLocaleString("fr-FR")} % ${t("des_pelerins", "des pèlerins")}` : ""}
                </div>
              </div>
              {g.info && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {t("benefice_agence", "Bénéfice de l'agence")}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: g.info.benefice.gnf < 0 ? "#FCA5A5" : "#FDE68A" }}>
                    {fmtGnf(g.info.benefice.gnf)} <span style={{ fontSize: 11, fontWeight: 500 }}>GNF</span>
                  </div>
                </div>
              )}
            </div>

            {/* Un bloc par associé, chiffres colonne par colonne */}
            {g.membres.map((m, i) => (
              <div key={m.id} className="bvg-bloc" style={{ padding: "0 20px 10px", borderTop: i === 0 ? "none" : `3px solid ${C.bordure}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "0 -20px 8px", padding: "12px 20px", background: C.orClair, borderBottom: `1px solid ${C.bordure}` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: m.est_caisse ? C.orClair : "#E8EDF5", color: m.est_caisse ? C.or : C.encre,
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14,
                  }}>
                    {m.est_caisse ? "🏦" : initiales(m.nom)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: C.encre }}>{m.nom}</div>
                    <div style={{ fontSize: 12, color: C.discret }}>
                      <span style={{ background: C.orClair, color: C.or, borderRadius: 999, padding: "1px 8px", fontWeight: 700 }}>
                        {m.pourcentage.toLocaleString("fr-FR")} %
                      </span>{" "}
                      {t("de_lagence", "de l'agence")}
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="bvg-tab" style={styleTableFixe}>
                    <Colonnes />
                    <thead><EnteteMonnaies /></thead>
                    <tbody>
                      <tr>
                        <td style={{ ...styleTdGauche, background: C.partFond, color: C.partTexte, fontWeight: 700, borderLeft: `4px solid ${C.partBord}` }}>{t("part_benefice", "Part du bénéfice")}</td>
                        <CellulesMontant valeur={m.part} fond={C.partFond} couleur={C.partTexte} />
                      </tr>
                      {!m.est_caisse && (
                        <tr>
                          <td style={{ ...styleTdGauche, background: C.detteFond, color: C.detteTexte, fontWeight: 700, borderLeft: `4px solid ${C.detteBord}` }}>{t("dettes_deduire", "Dettes à déduire")}</td>
                          <CellulesMontant valeur={m.dette} fond={C.detteFond} couleur={C.detteTexte} />
                        </tr>
                      )}
                      <tr>
                        <td style={{ ...styleTdGauche, fontWeight: 800, color: C.netTexte, background: C.netFond, borderLeft: `4px solid ${C.netBord}` }}>{t("net_recevoir", "Net à recevoir")}</td>
                        <CellulesMontant valeur={m.net} fort signe fond={C.netFond} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Total de l'agence (seulement s'il y a plusieurs associés) */}
            {g.membres.length > 1 && (
              <div className="bvg-bloc" style={{ padding: "14px 20px 8px", borderTop: `2px solid ${C.bordure}`, background: C.fond }}>
                <div style={{ fontWeight: 800, color: C.encre, marginBottom: 4 }}>{t("total_agence", "Total de l'agence")}</div>
                <div style={{ overflowX: "auto" }}>
                  <table className="bvg-tab" style={styleTableFixe}>
                    <Colonnes />
                    <thead><EnteteMonnaies /></thead>
                    <tbody>
                      <tr>
                        <td style={{ ...styleTdGauche, background: C.partFond, color: C.partTexte, fontWeight: 700, borderLeft: `4px solid ${C.partBord}` }}>{t("part_benefice", "Part du bénéfice")}</td>
                        <CellulesMontant valeur={totalPart} fond={C.partFond} couleur={C.partTexte} />
                      </tr>
                      <tr>
                        <td style={{ ...styleTdGauche, fontWeight: 800, color: C.netTexte, background: C.netFond, borderLeft: `4px solid ${C.netBord}` }}>{t("net_recevoir", "Net à recevoir")}</td>
                        <CellulesMontant valeur={totalNet} fort signe fond={C.netFond} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Total général */}
      <div style={{ ...styleCarte, background: C.encre, color: "#fff", padding: "18px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
          {t("total_general_nets", "Total net réparti à tous les associés")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[["GNF", fmtGnf(totalGeneral.gnf), totalGeneral.gnf], ["USD", fmtDev(totalGeneral.usd), totalGeneral.usd], ["SAR", fmtDev(totalGeneral.sar), totalGeneral.sar]].map(([monnaie, texte, brut]) => (
            <div key={monnaie}>
              <div style={{ fontSize: 11, color: "#CBD5E1", letterSpacing: 0.4 }}>{monnaie}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: brut < 0 ? "#FCA5A5" : "#FDE68A" }}>{texte}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}