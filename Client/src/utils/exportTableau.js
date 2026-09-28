// Utilitaire générique d'export pour les tableaux de Comptabilité (Excel + PDF/Impression).
// Utilisé par le composant <BoutonExporter /> sur toutes les pages : Budget de fonctionnement,
// Bénéfices Global, Bénéfices Individuel, Bénéfices par Pèlerin, Dette, Créance,
// Devis/Facture, Bons de sortie, Dépenses, Dettes fournisseurs, etc.
//
// exceljs est chargé en import dynamique : il n'entre dans le bundle qu'au moment
// où l'utilisateur clique réellement sur "Exporter en Excel".

const COULEUR_ENTETE = "FF10151F"; // navy
const COULEUR_OR = "FFC9972B"; // or / accent
const COULEUR_FOND_ALT = "FFFAF9F5"; // papier
const COULEUR_TEXTE_TOTAL = "FF10151F";

function formaterNomFichier(base) {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const horodatage = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
  const nomPropre = (base || "export")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `BVG_${nomPropre}_${horodatage}.xlsx`;
}

function declencherTelechargement(blob, nomFichier) {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  window.URL.revokeObjectURL(url);
}

/**
 * Exporte un tableau en fichier Excel (.xlsx), avec en-tête BVG, colonnes typées et ligne de total.
 *
 * @param {Object} options
 * @param {string} options.titre - Titre principal (ex: "Budget de fonctionnement")
 * @param {string} [options.sousTitre] - Ligne secondaire (ex: "Saison Hajj 2026 — Activité : Hajj")
 * @param {Array<{cle:string, entete:string, largeur?:number, format?:'texte'|'nombre'|'date'|'devise', decimales?:number, align?:'left'|'right'|'center'}>} options.colonnes
 * @param {Array<Object>} options.lignes - Tableau d'objets, une entrée par clé de colonne
 * @param {Object<string, number|string>} [options.totaux] - { cle: valeur } pour la ligne de total (optionnel)
 * @param {string} [options.nomFichier] - Nom de base du fichier (sans extension)
 */
export async function exporterTableauExcel({
  titre,
  sousTitre = "",
  colonnes,
  lignes,
  totaux = null,
  nomFichier,
}) {
  const ExcelJS = (await import("exceljs")).default;

  const wb = new ExcelJS.Workbook();
  wb.creator = "BateVoyage Guinée";
  wb.created = new Date();

  const ws = wb.addWorksheet("Export", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: "frozen", ySplit: sousTitre ? 4 : 3 }],
  });

  const nbColonnes = colonnes.length;

  // Titre
  ws.mergeCells(1, 1, 1, nbColonnes);
  const celluleTitre = ws.getCell(1, 1);
  celluleTitre.value = `BateVoyage Guinée — ${titre}`;
  celluleTitre.font = { bold: true, size: 14, color: { argb: COULEUR_ENTETE } };
  ws.getRow(1).height = 24;

  let ligneEntete = 2;
  if (sousTitre) {
    ws.mergeCells(2, 1, 2, nbColonnes);
    const celluleSousTitre = ws.getCell(2, 1);
    celluleSousTitre.value = sousTitre;
    celluleSousTitre.font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    ligneEntete = 3;
  }

  ligneEntete += 1; // ligne vide de respiration
  const ligneEnTetesColonnes = ligneEntete;

  // Largeurs de colonnes
  ws.columns = colonnes.map((c) => ({ width: c.largeur || 18 }));

  // En-têtes
  colonnes.forEach((c, i) => {
    const cell = ws.getRow(ligneEnTetesColonnes).getCell(i + 1);
    cell.value = c.entete;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEUR_ENTETE } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: COULEUR_OR } } };
  });
  ws.getRow(ligneEnTetesColonnes).height = 22;

  // Lignes de données
  let ligneCourante = ligneEnTetesColonnes + 1;
  lignes.forEach((ligne, indexLigne) => {
    const row = ws.getRow(ligneCourante);
    colonnes.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const valeur = ligne[c.cle];

      if (c.format === "date" && valeur) {
        cell.value = valeur instanceof Date ? valeur : new Date(valeur);
        cell.numFmt = "dd/mm/yyyy";
      } else if (c.format === "nombre" || c.format === "devise") {
        cell.value = valeur === null || valeur === undefined || valeur === "" ? null : Number(valeur);
        cell.numFmt = c.decimales ? `#,##0.${"0".repeat(c.decimales)}` : "#,##0";
      } else {
        cell.value = valeur === null || valeur === undefined ? "" : String(valeur);
      }

      cell.alignment = {
        horizontal: c.align || (c.format === "nombre" || c.format === "devise" ? "right" : "left"),
        vertical: "middle",
      };

      if (indexLigne % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COULEUR_FOND_ALT } };
      }
    });
    ligneCourante += 1;
  });

  // Ligne de total (optionnelle)
  if (totaux) {
    const rowTotal = ws.getRow(ligneCourante);
    colonnes.forEach((c, i) => {
      const cell = rowTotal.getCell(i + 1);
      if (Object.prototype.hasOwnProperty.call(totaux, c.cle)) {
        cell.value = Number(totaux[c.cle]);
        cell.numFmt = c.decimales ? `#,##0.${"0".repeat(c.decimales)}` : "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (i === 0) {
        cell.value = "TOTAL";
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
      cell.font = { bold: true, color: { argb: COULEUR_TEXTE_TOTAL } };
      cell.border = { top: { style: "medium", color: { argb: COULEUR_OR } } };
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  declencherTelechargement(blob, formaterNomFichier(nomFichier || titre));
}

/**
 * Exporte un tableau en PDF en ouvrant une fenêtre d'impression stylée (le navigateur
 * gère l'enregistrement en PDF via "Imprimer > Enregistrer en PDF"). Évite d'ajouter
 * une librairie PDF lourde côté client puisque le style d'impression natif suffit.
 *
 * Mêmes options que exporterTableauExcel (colonnes, lignes, totaux).
 */
export function exporterTableauPdf({ titre, sousTitre = "", colonnes, lignes, totaux = null }) {
  const formaterValeur = (colonne, valeur) => {
    if (valeur === null || valeur === undefined || valeur === "") return "—";
    if (colonne.format === "date") {
      const d = valeur instanceof Date ? valeur : new Date(valeur);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("fr-FR");
    }
    if (colonne.format === "nombre" || colonne.format === "devise") {
      const n = Number(valeur);
      if (Number.isNaN(n)) return "—";
      return n.toLocaleString("fr-FR", {
        minimumFractionDigits: colonne.decimales || 0,
        maximumFractionDigits: colonne.decimales || 0,
      });
    }
    return String(valeur);
  };

  const theadHtml = `<tr>${colonnes
    .map((c) => `<th style="text-align:${c.align || (c.format === "nombre" || c.format === "devise" ? "right" : "left")}">${c.entete}</th>`)
    .join("")}</tr>`;

  const tbodyHtml = lignes
    .map(
      (ligne, i) =>
        `<tr class="${i % 2 === 1 ? "alt" : ""}">${colonnes
          .map(
            (c) =>
              `<td style="text-align:${c.align || (c.format === "nombre" || c.format === "devise" ? "right" : "left")}">${formaterValeur(
                c,
                ligne[c.cle]
              )}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const tfootHtml = totaux
    ? `<tr class="total">${colonnes
        .map((c, i) => {
          if (Object.prototype.hasOwnProperty.call(totaux, c.cle)) {
            return `<td style="text-align:right">${formaterValeur(c, totaux[c.cle])}</td>`;
          }
          return `<td>${i === 0 ? "TOTAL" : ""}</td>`;
        })
        .join("")}</tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${titre}</title>
<style>
  @page { size: A4 landscape; margin: 1.4cm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #10151F; margin: 0; padding: 0; }
  .entete { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0B3FA0; padding-bottom: 8px; margin-bottom: 14px; }
  .entete h1 { font-size: 16px; margin: 0; color: #0B3FA0; }
  .entete .sous-titre { font-size: 10px; color: #6B7280; margin-top: 3px; }
  .entete .marque { font-size: 11px; font-weight: bold; color: #C9972B; letter-spacing: 0.5px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { background: #10151F; color: #fff; padding: 7px 6px; font-weight: bold; }
  td { padding: 6px; border-bottom: 1px solid #E5E7EB; font-variant-numeric: tabular-nums; }
  tr.alt td { background: #FAF9F5; }
  tr.total td { border-top: 2px solid #C9972B; font-weight: bold; color: #10151F; padding-top: 8px; }
  .pied { margin-top: 16px; font-size: 9px; color: #9CA3AF; text-align: right; }
</style>
</head>
<body>
  <div class="entete">
    <div>
      <h1>${titre}</h1>
      ${sousTitre ? `<div class="sous-titre">${sousTitre}</div>` : ""}
    </div>
    <div class="marque">BateVoyage Guinée</div>
  </div>
  <table>
    <thead>${theadHtml}</thead>
    <tbody>${tbodyHtml}</tbody>
    ${tfootHtml ? `<tfoot>${tfootHtml}</tfoot>` : ""}
  </table>
  <div class="pied">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 200);
    };
  </script>
</body>
</html>`;

  const fenetre = window.open("", "_blank", "width=1100,height=800");
  if (!fenetre) {
    // Bloqueur de pop-up : on informe l'appelant plutôt que d'échouer silencieusement.
    throw new Error("POPUP_BLOQUEE");
  }
  fenetre.document.open();
  fenetre.document.write(html);
  fenetre.document.close();
}