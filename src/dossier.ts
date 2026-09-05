/**
 * LE DOSSIER : l'unité que l'outil note. Un client tel qu'il était le jour d'une revue
 * périodique : ses attributs déclarés (pays, activité, produits, exposition, structure de
 * propriété, canal d'entrée, ancienneté) et le résumé de son comportement sur les douze
 * mois qui précèdent la revue (chiffre d'affaires observé contre déclaré, part d'espèces,
 * part transfrontière, dormance). C'est la couture entre les lots avec `facteur.ts` : les
 * facteurs (L1) lisent un Dossier, les dossiers écrits et générés (L2) produisent des
 * Dossiers, la mesure client (L3) reconstruit des Dossiers depuis les deux CSV du client.
 *
 * Rien ici n'est une valeur du client qui pourrait ressortir : un Dossier vit en mémoire,
 * le rapport n'en cite que le verdict, par review_id.
 */

export type Kind = "individual" | "entity";
export const KINDS = ["individual", "entity"] as const;

export type Pep = "none" | "pep" | "pep-relative";
export const PEPS = ["none", "pep", "pep-relative"] as const;

export type Produit = "cash" | "wire" | "card" | "correspondent" | "private" | "crypto" | "safe" | "trade";
export const PRODUITS = ["cash", "wire", "card", "correspondent", "private", "crypto", "safe", "trade"] as const;

export type Canal = "branch" | "remote" | "introduced";
export const CANAUX = ["branch", "remote", "introduced"] as const;

export interface Dossier {
  /** le review_id du client, ou l'identifiant du dossier écrit (jamais un customer_id) */
  id: string;
  kind: Kind;
  /** ISO 3166-1 alpha-2, pays de résidence (personne) ou du siège (entité) */
  residence: string;
  /** ISO 3166-1 alpha-2, nationalité (personne) ou pays d'immatriculation (entité) ; absent = inconnu */
  nationality?: string;
  /** le code d'activité ou de profession du client, tel quel ; la table déclarée le lit */
  activity: string;
  products: Produit[];
  pep: Pep;
  adverseMedia: boolean;
  /** couches de propriété au-dessus du client ; 0 pour une personne */
  ownershipLayers: number;
  /** le bénéficiaire effectif est nommé ; true pour une personne */
  beneficialOwnerNamed: boolean;
  /** au moins une couche dans une juridiction de la liste déclarée */
  opaqueJurisdiction: boolean;
  onboarding: Canal;
  /** ancienneté de la relation au jour de la revue, en jours, ≥ 0 */
  relationshipDays: number;
  /** chiffre d'affaires annuel déclaré à l'entrée en relation, > 0 */
  declaredTurnover: number;
  /** chiffre d'affaires observé sur les 365 jours avant la revue, ≥ 0 */
  observedTurnover: number;
  /** part des espèces dans les mouvements, dans [0, 1] */
  cashRatio: number;
  /** part des mouvements transfrontières, dans [0, 1] */
  crossBorderRatio: number;
  /** jours sans mouvement avant le dernier réveil ; 0 si inconnu ou jamais dormant */
  dormantDays: number;
  /** le jour de la revue, ISO (AAAA-MM-JJ) */
  reviewedAt: string;
}

const ISO_JOUR = /^\d{4}-\d{2}-\d{2}$/;
const ISO_PAYS = /^[A-Z]{2}$/;

/** Un dossier conforme, ou une erreur qui nomme le champ : la couture refuse avant de noter. */
export function exigerDossier(d: Dossier): Dossier {
  const ou = `dossier ${d.id}`;
  if (!d.id) throw new Error("a dossier needs an id (the review_id, or the written case's identifier)");
  if (!KINDS.includes(d.kind)) throw new Error(`${ou}: kind must be one of ${KINDS.join(", ")}, got "${d.kind}"`);
  if (!ISO_PAYS.test(d.residence)) throw new Error(`${ou}: residence must be an ISO 3166-1 alpha-2 code, got "${d.residence}"`);
  if (d.nationality !== undefined && !ISO_PAYS.test(d.nationality)) throw new Error(`${ou}: nationality must be an ISO 3166-1 alpha-2 code, got "${d.nationality}"`);
  if (!d.activity) throw new Error(`${ou}: activity code is empty`);
  for (const p of d.products) if (!PRODUITS.includes(p)) throw new Error(`${ou}: product "${p}" is not one of ${PRODUITS.join(", ")}`);
  if (!PEPS.includes(d.pep)) throw new Error(`${ou}: pep must be one of ${PEPS.join(", ")}, got "${d.pep}"`);
  if (!CANAUX.includes(d.onboarding)) throw new Error(`${ou}: onboarding must be one of ${CANAUX.join(", ")}, got "${d.onboarding}"`);
  if (!Number.isInteger(d.ownershipLayers) || d.ownershipLayers < 0) throw new Error(`${ou}: ownershipLayers must be an integer >= 0`);
  if (d.kind === "individual" && d.ownershipLayers !== 0) throw new Error(`${ou}: an individual has no ownership layers`);
  if (!Number.isFinite(d.relationshipDays) || d.relationshipDays < 0) throw new Error(`${ou}: relationshipDays must be >= 0`);
  if (!(d.declaredTurnover > 0)) throw new Error(`${ou}: declaredTurnover must be > 0`);
  if (!(d.observedTurnover >= 0)) throw new Error(`${ou}: observedTurnover must be >= 0`);
  for (const [nom, v] of [["cashRatio", d.cashRatio], ["crossBorderRatio", d.crossBorderRatio]] as const) {
    if (!(v >= 0 && v <= 1)) throw new Error(`${ou}: ${nom} must be within [0, 1], got ${v}`);
  }
  if (!Number.isFinite(d.dormantDays) || d.dormantDays < 0) throw new Error(`${ou}: dormantDays must be >= 0`);
  if (!ISO_JOUR.test(d.reviewedAt)) throw new Error(`${ou}: reviewedAt must be an ISO day (YYYY-MM-DD), got "${d.reviewedAt}"`);
  return d;
}
