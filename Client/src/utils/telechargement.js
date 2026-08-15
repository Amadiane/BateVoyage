import api from "../services/api";

export async function ouvrirFichierProtege(url) {
  const nouvelOnglet = window.open("", "_blank");
  if (nouvelOnglet) {
    nouvelOnglet.document.write("Chargement du document...");
  }

  try {
    const reponse = await api.get(url, { responseType: "blob" });
    const urlBlob = window.URL.createObjectURL(reponse.data);

    if (nouvelOnglet) {
      nouvelOnglet.location.href = urlBlob;
    }
    setTimeout(() => window.URL.revokeObjectURL(urlBlob), 30000);
  } catch (erreur) {
    if (nouvelOnglet) nouvelOnglet.close();
    gererErreurDocument(erreur);
  }
}

export async function telechargerFichierProtege(url, nomFichierRepli) {
  try {
    const reponse = await api.get(url, { responseType: "blob" });
    const nomReel = reponse.headers["x-nom-fichier-reel"] || nomFichierRepli;

    const urlBlob = window.URL.createObjectURL(reponse.data);
    const lien = document.createElement("a");
    lien.href = urlBlob;
    lien.download = nomReel;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);

    setTimeout(() => window.URL.revokeObjectURL(urlBlob), 30000);
  } catch (erreur) {
    gererErreurDocument(erreur);
  }
}

function gererErreurDocument(erreur) {
  const statut = erreur.response?.status;
  if (statut === 404) {
    alert("Ce document n'a pas encore été téléversé pour ce pèlerin.");
  } else {
    alert("Erreur lors du chargement du document. Réessayez ou contactez le support technique.");
  }
  console.error("Erreur document :", erreur);
}