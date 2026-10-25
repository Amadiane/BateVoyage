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

// Styles de ligne facultatifs : une ligne peut porter "_style" pour être colorée dans
// l'Excel ET dans le PDF (ex. tableaux de répartition par agence / par associé).
// Les lignes sans "_style" gardent exactement l'ancien rendu.
const STYLES_LIGNE = {
  agence: { fondArgb: "FF10151F", texteArgb: "FFFFFFFF", fond: [16, 21, 31], texte: [255, 255, 255], gras: true },
  associe: { fondArgb: "FFF6EEDB", texteArgb: "FF10151F", fond: [246, 238, 219], texte: [16, 21, 31], gras: true },
  part: { fondArgb: "FFEFF6FF", texteArgb: "FF1E3A8A", fond: [239, 246, 255], texte: [30, 58, 138], gras: false },
  dette: { fondArgb: "FFFEF2F2", texteArgb: "FFB91C1C", fond: [254, 242, 242], texte: [185, 28, 28], gras: false },
  net: { fondArgb: "FFECFDF5", texteArgb: "FF047857", fond: [236, 253, 245], texte: [4, 120, 87], gras: true },
  total: { fondArgb: "FFFAF3E0", texteArgb: "FF10151F", fond: [250, 243, 224], texte: [16, 21, 31], gras: true },
};
// Une ligne "associe" est un simple titre : on n'affiche rien dans les colonnes de montants.
const estLigneTitre = (ligne) => ligne && (ligne._style === "associe");

function formaterNomFichier(base) {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const horodatage = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
  const nomPropre = (base || "export")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

      const styleLigne = STYLES_LIGNE[ligne._style];
      if (styleLigne) {
        if (estLigneTitre(ligne) && i > 0) cell.value = null;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: styleLigne.fondArgb } };
        cell.font = { bold: styleLigne.gras, color: { argb: styleLigne.texteArgb } };
        if (ligne._style === "agence") cell.border = { bottom: { style: "medium", color: { argb: COULEUR_OR } } };
      } else if (indexLigne % 2 === 1) {
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

  // toLocaleString("fr-FR") utilise une espace fine insécable (U+202F) comme séparateur
  // de milliers : les polices standard embarquées dans un PDF n'ont pas ce glyphe et le
  // remplacent par un caractère parasite (ex: "395 600" devient "395/600"). On formate
  // donc les nombres nous-mêmes avec une espace normale, sûre à l'impression.
  const formaterNombrePdf = (valeur, decimales = 0) => {
    const n = Number(valeur);
    if (Number.isNaN(n)) return "-";
    const negatif = n < 0;
    const fixe = Math.abs(n).toFixed(decimales);
    const [entier, dec] = fixe.split(".");
    const entierEspace = entier.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const resultat = dec ? `${entierEspace},${dec}` : entierEspace;
    return negatif ? `-${resultat}` : resultat;
  };

  // Les polices standard de jsPDF n'ont pas toujours le glyphe du tiret cadratin "—" :
  // on utilise un tiret simple pour les valeurs vides, plus sûr à l'impression.
  const formaterValeur = (colonne, valeur) => {
    if (valeur === null || valeur === undefined || valeur === "") return "-";
    if (colonne.format === "date") {
      const d = valeur instanceof Date ? valeur : new Date(valeur);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("fr-FR");
    }
    if (colonne.format === "nombre" || colonne.format === "devise") {
      return formaterNombrePdf(valeur, colonne.decimales || 0);
    }
    return String(valeur);
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const MARGE = 12;
  const largeurPage = doc.internal.pageSize.getWidth();
  const largeurDisponible = largeurPage - MARGE * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(16, 21, 31);
  doc.text("BateVoyage Guinée", MARGE, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(11, 63, 160);
  doc.text(titre, MARGE, 21);

  let startY = 27;
  if (sousTitre) {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(sousTitre, MARGE, 26.5);
    startY = 31;
  }

  // Liseré doré sous l'en-tête, comme le reste de l'interface.
  doc.setDrawColor(201, 151, 43);
  doc.setLineWidth(0.6);
  doc.line(MARGE, startY - 3, largeurPage - MARGE, startY - 3);

  const head = [colonnes.map((c) => c.entete)];
  const body = lignes.map((ligne) =>
    colonnes.map((c, i) => (estLigneTitre(ligne) && i > 0 ? "" : formaterValeur(c, ligne[c.cle])))
  );
  const foot = totaux
    ? [
        colonnes.map((c, i) => {
          if (Object.prototype.hasOwnProperty.call(totaux, c.cle)) return formaterValeur(c, totaux[c.cle]);
          return i === 0 ? "TOTAL" : "";
        }),
      ]
    : undefined;

  // Largeurs de colonnes proportionnelles à "largeur" (mêmes proportions que l'export
  // Excel), réparties sur toute la largeur disponible de la page — évite les colonnes
  // trop étroites ou des espaces vides mal répartis.
  const totalUnites = colonnes.reduce((s, c) => s + (c.largeur || 18), 0);
  const columnStyles = Object.fromEntries(
    colonnes.map((c, i) => {
      const estNumerique = c.format === "nombre" || c.format === "devise";
      return [
        i,
        {
          cellWidth: ((c.largeur || 18) / totalUnites) * largeurDisponible,
          halign: c.align || (estNumerique ? "right" : "left"),
          valign: "middle",
        },
      ];
    })
  );

  autoTable(doc, {
    startY,
    head,
    body,
    foot,
    theme: "grid",
    margin: { left: MARGE, right: MARGE, top: MARGE, bottom: 10 },
    tableWidth: largeurDisponible,
    pageBreak: "auto",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 2.2, right: 3.5, bottom: 2.2, left: 3.5 },
      textColor: [31, 41, 55],
      lineColor: [230, 227, 214],
      lineWidth: 0.15,
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: 0,
    },
    headStyles: {
      fillColor: [16, 21, 31],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.8,
      halign: "center",
      lineColor: [201, 151, 43],
      lineWidth: { bottom: 0.5 },
      cellPadding: { top: 2.6, right: 3.5, bottom: 2.6, left: 3.5 },
    },
    footStyles: {
      fillColor: [250, 243, 224],
      textColor: [16, 21, 31],
      fontStyle: "bold",
      fontSize: 8.8,
      lineColor: [201, 151, 43],
      lineWidth: { top: 0.5 },
      cellPadding: { top: 2.6, right: 3.5, bottom: 2.6, left: 3.5 },
    },
    alternateRowStyles: { fillColor: [250, 249, 245] },
    columnStyles,
    // Couleurs par type de ligne (agence, associé, part, dette, net, total)
    didParseCell: (data) => {
      if (data.section === "foot") {
        const col = colonnes[data.column.index];
        if (col && (col.format === "nombre" || col.format === "devise")) data.cell.styles.halign = "right";
        return;
      }
      if (data.section !== "body") return;
      const ligne = lignes[data.row.index];
      const styleLigne = ligne && STYLES_LIGNE[ligne._style];
      if (!styleLigne) return;
      data.cell.styles.fillColor = styleLigne.fond;
      data.cell.styles.textColor = styleLigne.texte;
      data.cell.styles.fontStyle = styleLigne.gras ? "bold" : "normal";
      if (ligne._style === "agence") {
        data.cell.styles.fontSize = 9.5;
        data.cell.styles.cellPadding = { top: 3, right: 3.5, bottom: 3, left: 3.5 };
      }
    },
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Genere le ${new Date().toLocaleDateString("fr-FR")} a ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        MARGE,
        pageHeight - 7
      );
    },
  });

  doc.save(formaterNomFichier(nomFichier || titre).replace(/\.xlsx$/, ".pdf"));
}