/**
 * PALIER 4 : `exposure`. L'exposition politique ou médiatique DÉCLARÉE du dossier.
 *
 * Deux signaux, chacun au poids que la table `exposition` déclare, unis par `combiner` :
 *   · le statut PEP — `pep` pèse `exposition.pep`, `pep-relative` pèse
 *     `exposition.pepRelative` (le proche n'est pas la personne exposée elle-même, et la
 *     table dit de combien), `none` ne pèse rien ;
 *   · la presse défavorable — `adverseMedia` pèse `exposition.adverseMedia`.
 *
 * Ce facteur lit ce que le dossier DÉCLARE, il ne cherche rien : le filtrage des noms et
 * la presse sont le travail d'autres outils de la maison ; celui-ci mesure ce que la
 * déclaration, seule, vaut au moment de la revue.
 */
import { combiner, type Facteur } from "../facteur.ts";

export const exposure: Facteur = {
  id: "exposure",
  description: "declared political and media exposure: PEP status and adverse media, at declared weights",
  rang: 4,
  tablesLues: ["exposition"],
  score: (d, tables) => combiner([
    d.pep === "pep" ? tables.exposition.pep : d.pep === "pep-relative" ? tables.exposition.pepRelative : 0,
    d.adverseMedia ? tables.exposition.adverseMedia : 0,
  ]),
};
