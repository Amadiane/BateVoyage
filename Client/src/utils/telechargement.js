import api from "../services/api";

export async function ouvrirFichierProtege(url, nomFichier) {
  const reponse = await api.get(url, { responseType: "blob" });
  const urlBlob = window.URL.createObjectURL(reponse.data);
  const lien = document.createElement("a");
  lien.href = urlBlob;
  lien.target = "_blank";
  if (nomFichier) lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => window.URL.revokeObjectURL(urlBlob), 15000);
}