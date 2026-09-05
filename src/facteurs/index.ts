/**
 * LE REGISTRE DES FACTEURS (lot A-L1 le remplit ; ce fichier n'est que sa place). Tant
 * qu'aucun facteur n'est livré, le registre est vide et `absents()` DÉRIVE les sept ids du
 * contrat : rien n'est récité, et la garde de la frontière voit un sous-dossier à énumérer.
 */
import { PALIERS, type PalierId, type Registre } from "../facteur.ts";

export function registre(): Registre {
  return new Map();
}

export function absents(r: Registre = registre()): PalierId[] {
  return PALIERS.filter((p) => !r.has(p));
}
