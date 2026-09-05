/**
 * PALIER 3 : `product`. Les produits détenus, un poids déclaré par produit, unis.
 *
 * Chaque produit détenu apporte le poids que `produitRisque` lui déclare (absent : 0), et
 * les poids s'unissent par `combiner` : détenir espèces ET crypto pèse plus que l'un des
 * deux, sans jamais dépasser 1 — c'est l'union de signaux, pas leur somme, et c'est la
 * même règle que `geography`. Un client sans produit note 0 : ce facteur ne voit que ce
 * que le client détient.
 */
import { combiner, type Facteur } from "../facteur.ts";

export const product: Facteur = {
  id: "product",
  description: "the products held, one declared weight each, combined without ever exceeding one",
  rang: 3,
  tablesLues: ["produitRisque"],
  score: (d, tables) => combiner(d.products.map((p) => tables.produitRisque[p] ?? 0)),
};
