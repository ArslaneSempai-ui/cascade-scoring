/**
 * PALIER 1 : `geography`. Le pays de résidence et de nationalité contre la liste déclarée.
 *
 * Le facteur le plus bête du contrat, et c'est sa fonction : la ligne de base que les six
 * autres doivent battre pour justifier leur coût. Deux lectures de la MÊME table
 * (`paysRisque`) : le pays de résidence, et la nationalité quand elle est connue — unies
 * par `combiner` (deux pays à risque pèsent plus qu'un seul, sans jamais dépasser 1).
 *
 * Un pays absent de la table vaut 0 : la table est une HYPOTHÈSE déclarée, courte,
 * remplaçable par celle du client — jamais une liste officielle recopiée. Une nationalité
 * inconnue ne vaut pas 0 en silence : elle est simplement absente de l'union, la résidence
 * seule décide, et le rapport compte ces dossiers « sans nationalité » à part (contrat §2).
 */
import { combiner, type Facteur } from "../facteur.ts";

export const geography: Facteur = {
  id: "geography",
  description: "residence and nationality against a declared country list; a country not on the list weighs nothing",
  rang: 1,
  tablesLues: ["paysRisque"],
  score: (d, tables) => combiner(
    d.nationality === undefined
      ? [tables.paysRisque[d.residence] ?? 0]
      : [tables.paysRisque[d.residence] ?? 0, tables.paysRisque[d.nationality] ?? 0],
  ),
};
