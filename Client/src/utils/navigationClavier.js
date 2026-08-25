/**
 * Crée un gestionnaire de touche "Entrée" qui déplace le focus vers le
 * champ suivant au lieu de soumettre le formulaire — évite d'avoir à
 * cliquer/tabuler manuellement entre chaque champ.
 *
 * Comportement :
 * - Ignore les <textarea> (l'utilisateur doit pouvoir faire un saut de ligne)
 * - Ignore les <button> (pour ne pas déclencher un clic accidentel)
 * - Sur le dernier champ visible, déclenche le bouton marqué
 *   data-bouton-suivant s'il existe (ex: "Suivant" ou "Enregistrer")
 */
export function creerGestionnaireEntree(refConteneur) {
  return function gererEntreeChampSuivant(e) {
    if (e.key !== "Enter") return;
    const cible = e.target;

    if (cible.tagName === "TEXTAREA") return;
    if (cible.tagName === "BUTTON") return;

    e.preventDefault();

    const conteneur = refConteneur.current;
    if (!conteneur) return;

    const elements = Array.from(
      conteneur.querySelectorAll("input, select, textarea")
    ).filter((el) => !el.disabled && el.type !== "hidden" && el.offsetParent !== null);

    const index = elements.indexOf(cible);

    if (index > -1 && index < elements.length - 1) {
      elements[index + 1].focus();
      if (typeof elements[index + 1].select === "function") {
        elements[index + 1].select();
      }
    } else if (index === elements.length - 1) {
      const boutonSuivant = conteneur.querySelector("[data-bouton-suivant]");
      boutonSuivant?.click();
    }
  };
}