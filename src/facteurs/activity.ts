/**
 * PALIER 2 : `activity`. Le code d'activité ou de profession contre la table déclarée.
 *
 * Une seule lecture, telle quelle : le code du client (libre, celui de SON référentiel)
 * dans `activiteRisque`. Un code absent vaut 0 — la table est courte et déclarée, et un
 * code qu'elle ne connaît pas n'est pas un risque, c'est une absence d'hypothèse ; le
 * client remplace la table par la sienne (`--tables`, lot L3) quand son référentiel est
 * plus riche. Aucune normalisation ici : deviner que « CASINO » et « casino » sont le même
 * code serait une hypothèse cachée dans du code, pas une table déclarée.
 */
import type { Facteur } from "../facteur.ts";

export const activity: Facteur = {
  id: "activity",
  description: "the customer's activity code against a declared risk table; an unknown code weighs nothing",
  rang: 2,
  tablesLues: ["activiteRisque"],
  score: (d, tables) => tables.activiteRisque[d.activity] ?? 0,
};
