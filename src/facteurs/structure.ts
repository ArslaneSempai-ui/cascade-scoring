/**
 * PALIER 5 : `structure`. La complexité de propriété : couches, bénéficiaire, juridictions.
 *
 * Trois signaux, tous aux poids que la table `structure` déclare, unis par `combiner` :
 *   · les COUCHES de propriété — l'opacité commence à `couchesOpaques` : chaque couche à
 *     partir de là apporte UN signal de poids `poidsCouche`, et l'union fait qu'une
 *     cascade de six couches pèse plus qu'une de trois sans jamais dépasser 1. En dessous
 *     du seuil déclaré, les couches ne comptent pas : une holding simple n'est pas une
 *     dissimulation, et c'est la table qui dit où la frontière passe ;
 *   · le BÉNÉFICIAIRE EFFECTIF non nommé — `poidsBeneficiaireInconnu` ;
 *   · une couche dans une JURIDICTION OPAQUE de la liste déclarée — `poidsJuridictionOpaque`.
 *
 * Une personne physique (0 couche, bénéficiaire nommé par construction) note 0 sauf
 * juridiction opaque : ce facteur regarde la STRUCTURE, pas la personne.
 */
import { combiner, type Facteur } from "../facteur.ts";

export const structure: Facteur = {
  id: "structure",
  description: "ownership complexity: layers past the declared opacity line, unnamed beneficial owner, opaque jurisdictions",
  rang: 5,
  tablesLues: ["structure"],
  score: (d, tables) => {
    const t = tables.structure;
    const couchesComptees = Math.max(0, d.ownershipLayers - t.couchesOpaques + 1);
    return combiner([
      ...Array.from({ length: couchesComptees }, () => t.poidsCouche),
      d.beneficialOwnerNamed ? 0 : t.poidsBeneficiaireInconnu,
      d.opaqueJurisdiction ? t.poidsJuridictionOpaque : 0,
    ]);
  },
};
