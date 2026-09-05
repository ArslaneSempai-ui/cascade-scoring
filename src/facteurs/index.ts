/**
 * LE REGISTRE DES FACTEURS (lot A-L1 le remplit ; ce fichier n'est que sa place). Tant
 * qu'aucun facteur n'est livré, le registre est vide et `absents()` DÉRIVE les sept ids du
 * contrat : rien n'est récité, et la garde de la frontière voit un sous-dossier à énumérer.
 */
import { PALIERS, type PalierId, type Registre, type Facteur } from "../facteur.ts";
import { geography } from "./geography.ts";
import { activity } from "./activity.ts";
import { product } from "./product.ts";
import { exposure } from "./exposure.ts";
import { structure } from "./structure.ts";
import { behaviour } from "./behaviour.ts";
import { tenure } from "./tenure.ts";

const FACTEURS: Facteur[] = [geography, activity, product, exposure, structure, behaviour, tenure];

export function registre(): Registre {
  const r = new Map<PalierId, Facteur>();
  for (const f of FACTEURS) {
    if (r.has(f.id)) throw new Error(`factor "${f.id}" registered twice`);
    r.set(f.id, f);
  }
  return r;
}

export function absents(r: Registre = registre()): PalierId[] {
  return PALIERS.filter((p) => !r.has(p));
}
