// Utilitaire générique d'export pour les tableaux de Comptabilité (Excel + PDF).
// Utilisé par le composant <BoutonExporter /> sur toutes les pages : Budget de fonctionnement,
// Bénéfices Global, Bénéfices Individuel, Bénéfices par Pèlerin, Dette, Créance,
// Devis/Facture, Bons de sortie, Dépenses, Dettes fournisseurs, etc.
//
// exceljs / jsPDF sont chargés en import dynamique : ils n'entrent dans le bundle qu'au
// moment où l'utilisateur clique réellement sur "Exporter".

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
 * Exporte un tableau en fichier PDF téléchargeable directement (pas d'impression
 * navigateur). jsPDF + jspdf-autotable sont chargés en import dynamique, comme
 * exceljs, pour ne pas alourdir le bundle initial.
 *
 * Mêmes options que exporterTableauExcel (colonnes, lignes, totaux).
 */
export async function exporterTableauPdf({ titre, sousTitre = "", colonnes, lignes, totaux = null, nomFichier }) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

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

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(16, 21, 31);
  doc.text(`BateVoyage Guinée — ${titre}`, 14, 15);

  let startY = 20;
  if (sousTitre) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(sousTitre, 14, 21);
    startY = 26;
  }

  const head = [colonnes.map((c) => c.entete)];
  const body = lignes.map((ligne) => colonnes.map((c) => formaterValeur(c, ligne[c.cle])));
  const foot = totaux
    ? [
        colonnes.map((c, i) => {
          if (Object.prototype.hasOwnProperty.call(totaux, c.cle)) return formaterValeur(c, totaux[c.cle]);
          return i === 0 ? "TOTAL" : "";
        }),
      ]
    : undefined;

  const colonnesNumeriques = colonnes
    .map((c, i) => ((c.format === "nombre" || c.format === "devise") ? i : null))
    .filter((i) => i !== null);

  autoTable(doc, {
    startY,
    head,
    body,
    foot,
    styles: { fontSize: 9, cellPadding: 2.2, textColor: [31, 41, 55], font: "helvetica" },
    headStyles: { fillColor: [16, 21, 31], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [250, 243, 224], textColor: [16, 21, 31], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 249, 245] },
    columnStyles: Object.fromEntries(colonnesNumeriques.map((i) => [i, { halign: "right" }])),
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        14,
        pageHeight - 8
      );
    },
  });

  doc.save(formaterNomFichier(nomFichier || titre).replace(/\.xlsx$/, ".pdf"));
}