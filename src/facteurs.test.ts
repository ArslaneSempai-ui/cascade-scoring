/**
 * LES SEPT FACTEURS, ÉPROUVÉS — la couture d'abord, puis chacun un à un, sur des dossiers
 * écrits À LA MAIN ICI (jamais ceux du lot L2 : un facteur éprouvé sur les dossiers qui
 * serviront à le mesurer apprendrait ses propres témoins).
 *
 * La couture : le registre porte les sept paliers dans l'ordre du contrat, les absents se
 * DÉRIVENT, chaque facteur note dans [0, 1], est déterministe, et ne lit que la table
 * qu'il déclare — les autres sont empoisonnées et le score ne doit pas bouger. Chaque
 * facteur a ensuite son archétype (le dossier qu'il doit voir), son sosie bénin, et ses
 * refus définitionnels dans les deux sens quand la définition a deux bords.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { PALIERS, combiner, type Tables } from "./facteur.ts";
import { exigerScore } from "./facteur.ts";
import { exigerDossier, type Dossier } from "./dossier.ts";
import { registre, absents } from "./facteurs/index.ts";
import { geography } from "./facteurs/geography.ts";
import { activity } from "./facteurs/activity.ts";
import { product } from "./facteurs/product.ts";
import { exposure } from "./facteurs/exposure.ts";
import { structure } from "./facteurs/structure.ts";
import { behaviour } from "./facteurs/behaviour.ts";
import { tenure } from "./facteurs/tenure.ts";

/** Les tables du témoin : courtes, écrites ici, jamais celles du lot L3. */
const T: Tables = {
  paysRisque: { IR: 0.9, KP: 1, PA: 0.6, VG: 0.5 },
  activiteRisque: { casino: 0.9, msb: 0.8, arms: 1 },
  produitRisque: { cash: 0.5, crypto: 0.7, correspondent: 0.8, private: 0.6, safe: 0.3, trade: 0.4, wire: 0.1, card: 0 },
  exposition: { pep: 0.9, pepRelative: 0.6, adverseMedia: 0.7 },
  structure: { couchesOpaques: 3, poidsCouche: 0.35, poidsBeneficiaireInconnu: 0.8, poidsJuridictionOpaque: 0.7 },
  comportement: { echelleEcartTurnover: 1, poidsEspeces: 0.8, poidsTransfrontiere: 0.6 },
  anciennete: { joursNeuf: 365, joursDormance: 180, poidsDistance: 0.6 },
};

/** Un dossier sage par défaut ; chaque témoin ne dit que ce qui l'écarte de la sagesse. */
function dossier(id: string, ecarts: Partial<Dossier> = {}): Dossier {
  return exigerDossier({
    id, kind: "individual", residence: "FR", nationality: "FR", activity: "salaried",
    products: ["card"], pep: "none", adverseMedia: false, ownershipLayers: 0,
    beneficialOwnerNamed: true, opaqueJurisdiction: false, onboarding: "branch",
    relationshipDays: 2_000, declaredTurnover: 30_000, observedTurnover: 31_000,
    cashRatio: 0.05, crossBorderRatio: 0.02, dormantDays: 0, reviewedAt: "2026-09-01",
    ...ecarts,
  });
}

const sage = dossier("sage");
const charge = dossier("charge", {
  kind: "entity", residence: "PA", nationality: "VG", activity: "msb",
  products: ["cash", "crypto", "correspondent"], pep: "pep", adverseMedia: true,
  ownershipLayers: 5, beneficialOwnerNamed: false, opaqueJurisdiction: true,
  onboarding: "remote", relationshipDays: 60, declaredTurnover: 50_000,
  observedTurnover: 900_000, cashRatio: 0.7, crossBorderRatio: 0.8, dormantDays: 400,
});

test("le registre porte les sept paliers du contrat, dans son ordre, et les absents se dérivent", () => {
  const r = registre();
  assert.deepEqual([...r.keys()], [...PALIERS]);
  assert.deepEqual(absents(r), []);
  assert.deepEqual([...r.values()].map((f) => f.rang), [1, 2, 3, 4, 5, 6, 7],
    "les rangs vont de 1 à 7 sans trou : la frontière peut ordonner par coût");
  const ampute = new Map([...r].filter(([id]) => id !== "structure"));
  assert.deepEqual(absents(ampute), ["structure"], "amputer le registre doit faire bouger la liste");
});

test("chaque facteur : score dans [0, 1], déterministe, une description et une table nommée", () => {
  for (const f of registre().values()) {
    for (const d of [sage, charge]) {
      const a = exigerScore(f.score(d, T), f.id, d);
      assert.equal(a, f.score(d, T), `${f.id} n'est pas déterministe`);
    }
    assert.ok(f.tablesLues.length >= 1, `${f.id} ne déclare aucune table : jamais aucune (couture)`);
    assert.ok(f.description.length > 10, `${f.id}: description vide`);
    assert.ok(f.score(charge, T) > f.score(sage, T),
      `${f.id} : le dossier chargé doit inquiéter plus que le sage`);
  }
});

test("un facteur ne lit que la table qu'il déclare (les autres sont empoisonnées)", () => {
  const POISONS: Tables = {
    paysRisque: { FR: 1, PA: 1, VG: 1, IR: 1, KP: 1 },
    activiteRisque: { salaried: 1, msb: 1, casino: 1 },
    produitRisque: { card: 1, cash: 1, crypto: 1, correspondent: 1, wire: 1, private: 1, safe: 1, trade: 1 },
    exposition: { pep: 1, pepRelative: 1, adverseMedia: 1 },
    structure: { couchesOpaques: 0, poidsCouche: 1, poidsBeneficiaireInconnu: 1, poidsJuridictionOpaque: 1 },
    comportement: { echelleEcartTurnover: 1e-9, poidsEspeces: 1, poidsTransfrontiere: 1 },
    anciennete: { joursNeuf: 1e9, joursDormance: 1e-9, poidsDistance: 1 },
  };
  for (const f of registre().values()) {
    for (const d of [sage, charge]) {
      const propre = f.score(d, T);
      const melange = Object.fromEntries(Object.entries(T).map(([cle, table]) =>
        [cle, f.tablesLues.includes(cle as keyof Tables) ? table : POISONS[cle as keyof Tables]])) as unknown as Tables;
      assert.equal(f.score(d, melange), propre, `${f.id} lit une table qu'il ne déclare pas (dossier ${d.id})`);
    }
  }
});

test("geography : l'union des deux pays, la nationalité inconnue lue comme absente, le pays hors liste comme nul", () => {
  const deuxPays = dossier("deux", { residence: "PA", nationality: "VG" });
  assert.equal(geography.score(deuxPays, T), combiner([0.6, 0.5]), "l'union, pas le max ni la somme");
  assert.ok(geography.score(deuxPays, T) > geography.score(dossier("un", { residence: "PA" /* FR de nationalité */ }), T));
  const sansNationalite = dossier("sans-nat", { residence: "PA", nationality: undefined });
  assert.equal(geography.score(sansNationalite, T), 0.6,
    "nationalité inconnue : la résidence seule décide, le rapport comptera ces dossiers à part");
  assert.equal(geography.score(sage, T), 0, "deux pays hors liste : rien, la liste est l'hypothèse");
});

test("activity : le code tel quel, sans normalisation devinée", () => {
  assert.equal(activity.score(dossier("c", { activity: "casino" }), T), 0.9);
  assert.equal(activity.score(dossier("inconnu", { activity: "bakery" }), T), 0);
  assert.equal(activity.score(dossier("casse", { activity: "CASINO" }), T), 0,
    "CASINO n'est pas casino : deviner l'égalité serait une hypothèse cachée dans du code");
});

test("product : l'union croît avec chaque produit détenu et ne dépasse jamais 1", () => {
  const especes = dossier("e", { products: ["cash"] });
  const especesEtCrypto = dossier("ec", { products: ["cash", "crypto"] });
  const tout = dossier("t", { products: ["cash", "crypto", "correspondent", "private", "safe", "trade", "wire"] });
  assert.equal(product.score(especes, T), 0.5);
  assert.equal(product.score(especesEtCrypto, T), combiner([0.5, 0.7]));
  assert.ok(product.score(especesEtCrypto, T) > product.score(especes, T));
  assert.ok(product.score(tout, T) < 1 && product.score(tout, T) > 0.97);
  assert.equal(product.score(dossier("rien", { products: [] }), T), 0);
});

test("exposure : le proche pèse le poids déclaré du proche, jamais celui de la personne exposée", () => {
  assert.equal(exposure.score(dossier("p", { pep: "pep" }), T), 0.9);
  assert.equal(exposure.score(dossier("pr", { pep: "pep-relative" }), T), 0.6);
  assert.equal(exposure.score(dossier("m", { adverseMedia: true }), T), 0.7);
  assert.equal(exposure.score(dossier("pm", { pep: "pep", adverseMedia: true }), T), combiner([0.9, 0.7]));
  assert.equal(exposure.score(sage, T), 0);
});

test("structure : l'opacité commence à la couche déclarée, et chaque couche au-delà ajoute", () => {
  const entite = (couches: number, ecarts: Partial<Dossier> = {}) =>
    dossier(`s${couches}`, { kind: "entity", ownershipLayers: couches, ...ecarts });
  assert.equal(structure.score(entite(2), T), 0, "deux couches sous le seuil de trois : une holding simple");
  assert.equal(structure.score(entite(3), T), 0.35, "à la couche déclarée, le premier signal");
  assert.ok(structure.score(entite(5), T) > structure.score(entite(3), T), "chaque couche au-delà ajoute");
  assert.ok(structure.score(entite(50), T) <= 1);
  assert.equal(structure.score(entite(0, { beneficialOwnerNamed: false }), T), 0.8);
  assert.equal(structure.score(dossier("op", { opaqueJurisdiction: true }), T), 0.7,
    "une personne physique peut porter la juridiction opaque, et rien d'autre");
  const ecran = entite(5, { beneficialOwnerNamed: false, opaqueJurisdiction: true });
  assert.ok(structure.score(ecran, T) > 0.95, "la société écran complète cumule les trois signaux");
});

test("behaviour : l'écart de chiffre d'affaires compte dans les deux sens, relatif au déclaré", () => {
  const brasse = dossier("brasse", { declaredTurnover: 50_000, observedTurnover: 500_000 });
  const muet = dossier("muet", { declaredTurnover: 500_000, observedTurnover: 10_000 });
  const conforme = dossier("conforme", { declaredTurnover: 50_000, observedTurnover: 51_000 });
  assert.ok(behaviour.score(brasse, T) > 0.99, "dix fois le déclaré : l'écart relatif est de 9 échelles");
  assert.ok(behaviour.score(muet, T) > 0.6, "presque rien du déclaré : l'écart compte aussi vers le bas");
  assert.ok(behaviour.score(conforme, T) < 0.1);
  /* Le relatif est la définition : le même écart absolu pèse selon la taille déclarée. */
  const petit = dossier("petit", { declaredTurnover: 30_000, observedTurnover: 80_000 });
  const gros = dossier("gros", { declaredTurnover: 3_000_000, observedTurnover: 3_050_000 });
  assert.ok(behaviour.score(petit, T) > behaviour.score(gros, T),
    "50 000 d'écart : énorme pour une boulangerie, invisible pour un négoce");
  const especes = dossier("esp", { cashRatio: 1 });
  assert.equal(behaviour.score(especes, T), combiner([1 - Math.exp(-1_000 / 30_000), 0.8, 0.02 * 0.6]),
    "la part d'espèces au poids déclaré, unie aux autres signaux");
});

test("tenure : le neuf décroît linéairement, seul remote pèse le canal, la dormance est graduée", () => {
  const neuf = dossier("neuf", { relationshipDays: 0 });
  const anMoitie = dossier("demi", { relationshipDays: 182.5 });
  const vieux = dossier("vieux", { relationshipDays: 3_650 });
  assert.equal(tenure.score(neuf, T), 1, "zéro jour : le signal entier — l'ignorance pèse tout");
  assert.equal(tenure.score(anMoitie, T), 0.5);
  assert.equal(tenure.score(vieux, T), 0, "un client de dix ans, en agence, jamais dormant : rien");
  assert.equal(tenure.score(dossier("rem", { onboarding: "remote" }), T), 0.6);
  assert.equal(tenure.score(dossier("intro", { onboarding: "introduced" }), T), 0,
    "l'introducteur a un visage : s'il pèse, c'est la table du client qui le dira");
  const reveille = dossier("rev", { dormantDays: 180 });
  assert.ok(Math.abs(tenure.score(reveille, T) - (1 - Math.exp(-1))) < 1e-12,
    "à la dormance déclarée, l'écrasement de la maison : 0,63");
  assert.ok(tenure.score(dossier("longtemps", { dormantDays: 540 }), T) > tenure.score(reveille, T));
  /* L'archétype du contrat : neuf, à distance, réveillé — les trois signaux s'unissent. */
  const archetype = dossier("rnb", { relationshipDays: 30, onboarding: "remote", dormantDays: 200 });
  assert.ok(tenure.score(archetype, T) > 0.95);
});

test("les sosies bénins ne saturent pas les facteurs qui les regardent de près", () => {
  /* La boulangerie de quartier : espèces élevées, tout le reste sage — `product` la voit
     un peu (cash déclaré au poids déclaré), `behaviour` ne doit pas la crier. */
  const boulangerie = dossier("boul", { activity: "bakery", products: ["cash", "card"],
    declaredTurnover: 120_000, observedTurnover: 130_000, cashRatio: 0.6 });
  assert.ok(behaviour.score(boulangerie, T) < combiner([ecart(130_000, 120_000), 0.6 * 0.8, 0.02 * 0.6]) + 1e-12,
    "des espèces déclarées et un chiffre conforme : le comportement ne crie pas");
  assert.ok(behaviour.score(boulangerie, T) < 0.6);
  /* L'étudiant étranger : deux pays dont un listé, neuf, à distance — geography et tenure
     le voient, c'est leur définition ; structure et exposure doivent rester muets. */
  const etudiant = dossier("etu", { residence: "FR", nationality: "PA",
    relationshipDays: 90, onboarding: "remote", declaredTurnover: 12_000, observedTurnover: 9_000 });
  assert.equal(structure.score(etudiant, T), 0);
  assert.equal(exposure.score(etudiant, T), 0);
  function ecart(obs: number, dec: number): number { return 1 - Math.exp(-Math.abs(obs - dec) / dec / T.comportement.echelleEcartTurnover); }
});
