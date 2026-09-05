/**
 * PALIER 7 : `tenure`. L'ancienneté, le canal d'entrée, la dormance : le client qu'on ne
 * connaît pas encore, entré sans se montrer, et qui vient de se réveiller.
 *
 * Trois signaux, unis par `combiner`, tous depuis la table `anciennete` :
 *   · la NOUVEAUTÉ — linéaire, sans constante à nous : un client de zéro jour porte le
 *     signal entier, un client à `joursNeuf` ne le porte plus (1 − ancienneté/joursNeuf,
 *     plancheré à 0). La déclaration d'un client neuf n'a encore rien eu le temps de
 *     mentir : c'est l'ignorance qui pèse, pas un fait ;
 *   · le CANAL — `remote` pèse `poidsDistance` : personne n'a vu ce client. `branch` et
 *     `introduced` ne pèsent rien ICI : un introducteur a un visage et un dossier, et si
 *     une maison le compte comme un risque, c'est sa table (`--tables`) qui le dira, pas
 *     une constante cachée chez nous ;
 *   · la DORMANCE — `dormantDays` écrasé par `joursDormance` (l'écrasement de la maison :
 *     à la dormance déclarée, 0,63 ; au triple, 0,95) : un compte longtemps muet qui
 *     bouge à nouveau, gradué plutôt que tout-ou-rien.
 */
import { combiner, ecraser, type Facteur } from "../facteur.ts";

export const tenure: Facteur = {
  id: "tenure",
  description: "how new the relationship is, whether anyone ever saw the customer, and how long the account slept",
  rang: 7,
  tablesLues: ["anciennete"],
  score: (d, tables) => {
    const t = tables.anciennete;
    return combiner([
      Math.max(0, 1 - d.relationshipDays / t.joursNeuf),
      d.onboarding === "remote" ? t.poidsDistance : 0,
      ecraser(d.dormantDays, t.joursDormance),
    ]);
  },
};
