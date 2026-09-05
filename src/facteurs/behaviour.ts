/**
 * PALIER 6 : `behaviour`. L'écart du comportement OBSERVÉ au profil DÉCLARÉ à l'entrée.
 *
 * Trois signaux, unis par `combiner`, tous depuis la table `comportement` :
 *   · l'ÉCART DE CHIFFRE D'AFFAIRES — |observé − déclaré| / déclaré, RELATIF (un écart de
 *     50 000 est énorme pour une boulangerie et invisible pour un négoce), écrasé par
 *     `echelleEcartTurnover` avec l'écrasement de la maison : à l'échelle, 0,63. L'écart
 *     compte dans les DEUX sens — un client qui brasse dix fois ce qu'il a déclaré cache
 *     une activité, un client qui ne brasse presque rien n'est pas celui qu'il a déclaré
 *     être ;
 *   · la PART D'ESPÈCES — `cashRatio × poidsEspeces` : la part est déjà dans [0, 1], le
 *     poids déclaré dit ce qu'elle vaut au maximum ;
 *   · la PART TRANSFRONTIÈRE — `crossBorderRatio × poidsTransfrontiere`, même règle.
 *
 * C'est le facteur qui coûte : il exige d'observer douze mois de mouvements là où les
 * cinq premiers lisent une fiche. Il ne voit rien d'un client parfaitement conforme à sa
 * déclaration, tout en espèces déclarées comprises — c'est `product` qui porte ce
 * signal-là, et la description le dit pour que le rapport ne promette pas double.
 */
import { combiner, ecraser, type Facteur } from "../facteur.ts";

export const behaviour: Facteur = {
  id: "behaviour",
  description: "observed behaviour against the profile declared at onboarding: turnover gap both ways, cash share, cross-border share",
  rang: 6,
  tablesLues: ["comportement"],
  score: (d, tables) => {
    const t = tables.comportement;
    const ecart = Math.abs(d.observedTurnover - d.declaredTurnover) / d.declaredTurnover;
    return combiner([
      ecraser(ecart, t.echelleEcartTurnover),
      d.cashRatio * t.poidsEspeces,
      d.crossBorderRatio * t.poidsTransfrontiere,
    ]);
  },
};
