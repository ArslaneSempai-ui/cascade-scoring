/**
 * LA FRONTIÈRE — deux questions symétriques sur le même relevé scellé :
 *
 *     npm run optimise -- --from=<measured.json> --recall=0.90
 *       → parmi les cellules dont la BORNE BASSE de Wilson tient l'exigence, celle qui
 *         lève le MOINS DE FAUSSES ALERTES (la règle de l'outil) ; « none holds the
 *         floor » se dit tel quel, avec la plus forte borne atteignable ;
 *
 *     npm run optimise -- --from=<measured.json> --review-budget=800
 *       → le rappel maximal (à la borne basse) sous un budget de revues PAR MOIS — la
 *         conversion au mois vient des dates reviewed_at du fichier mesuré.
 *
 * Chaque dollar et chaque heure affichés portent leur hypothèse à côté.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { isMain, refuserDrapeauxInconnus } from "./cli.ts";
import { scelleIntact, empreinteDuReleve } from "./empreinte.ts";
import { ASSUMPTIONS, UNITS, symboleDe, analystHourlyCost, ligneDHypothese } from "./assumptions.ts";
import type { MesureRevues, Cellule } from "./your-reviews.ts";
import type { PalierId } from "./facteur.ts";

export type CellulePlacee = Cellule & { palier: PalierId; rang: number };

/**
 * Le plancher CONTRACTUEL du rappel : cité et optimisé dès CINQ escalades confirmées, à
 * la borne basse de Wilson ; sous cinq, rien ne se cite ni ne s'optimise. ET UN SEUL SENS
 * PAR DRAPEAU (le « -Infinity % » du rouge) : `reportable` garde son sens général ;
 * la citation et la sélection du rappel se décident sur MINIMUM_ESCALADES, explicitement.
 */
export const MINIMUM_ESCALADES = 5;

export function cellulesDe(m: MesureRevues): CellulePlacee[] {
  return Object.entries(m.paliers).flatMap(([palier, p]) =>
    p!.cellules.map((c) => ({ ...c, palier: palier as PalierId, rang: p!.rang })));
}

/** La règle de l'outil : borne basse >= exigence, puis le MOINS de fausses alertes,
 *  puis le moins de revues levées, puis le rang, puis le seuil strict. */
export function meilleureSousRappel(cellules: readonly CellulePlacee[], rappelMin: number): CellulePlacee | null {
  const tenables = cellules.filter((c) => c.rappel.n >= MINIMUM_ESCALADES && c.rappel.low >= rappelMin);
  if (tenables.length === 0) return null;
  return [...tenables].sort((a, b) =>
    a.faussesAlertes.successes - b.faussesAlertes.successes
    || a.tirees - b.tirees || a.rang - b.rang || b.seuil - a.seuil)[0]!;
}

export function meilleureSousBudget(
  cellules: readonly CellulePlacee[], budgetParMois: number, joursDePeriode: number,
): CellulePlacee | null {
  const parMois = (c: CellulePlacee) => c.tirees * (30 / joursDePeriode);
  const tenables = cellules.filter((c) => c.rappel.n >= MINIMUM_ESCALADES && parMois(c) <= budgetParMois);
  if (tenables.length === 0) return null;
  return [...tenables].sort((a, b) =>
    b.rappel.low - a.rappel.low
    || a.faussesAlertes.successes - b.faussesAlertes.successes || a.rang - b.rang)[0]!;
}

/** La plus forte borne basse ATTEIGNABLE, ou null : Math.max() sur un ensemble vide rend
 *  -Infinity, et « -Infinity % » est ce qu'un message d'échec a déjà imprimé une fois. */
export function plusForteBorne(cellules: readonly CellulePlacee[]): number | null {
  const bornees = cellules.filter((c) => c.rappel.n >= MINIMUM_ESCALADES);
  if (bornees.length === 0) return null;
  return Math.max(...bornees.map((c) => c.rappel.low));
}

export function heuresDAnalyste(nRevues: number): { heures: number; usd: number } {
  const heures = (nRevues * ASSUMPTIONS.minutesPerReview) / 60;
  return { heures, usd: heures * analystHourlyCost() };
}

export function lireReleve(chemin: string): MesureRevues {
  const brut = JSON.parse(readFileSync(chemin, "utf8")) as MesureRevues;
  if (brut?.kind !== "scoring-client-record") {
    throw new Error(`${basename(chemin)} is not a scoring record: its kind is `
      + `${JSON.stringify((brut as { kind?: unknown })?.kind ?? null)}.\n`
      + `  Point --from at the <file>-measured.json that measure:yours wrote.`);
  }
  if (typeof brut.empreinte !== "string" || !brut.empreinte) {
    throw new Error(`${basename(chemin)} carries no seal; a hand-made record would enter\n`
      + `  the frontier with the authority of a measurement. Re-run measure:yours.`);
  }
  if (!scelleIntact(brut as unknown as Record<string, unknown>)) {
    throw new Error(`${basename(chemin)} does not match its own fingerprint: it carries `
      + `${brut.empreinte}, its content computes to ${empreinteDuReleve(brut)}.\n`
      + `  The file changed after it was sealed. Nothing was optimised.`);
  }
  return brut;
}

export function lireRappelMin(brut: string): number {
  if (!/^(0(\.\d+)?|1(\.0+)?)$/.test(brut)) {
    throw new Error(`--recall=${brut} is not a recall this tool reads. It wants a number\n`
      + `  between 0 and 1, like --recall=0.90 — the floor your compliance committee owns.`);
  }
  return Number(brut);
}

export function lireBudget(brut: string): number {
  if (!/^\d{1,9}$/.test(brut) || Number(brut) < 1) {
    throw new Error(`--review-budget=${brut} is not a budget this tool reads. It wants a whole\n`
      + `  number of reviews per month your analysts can conclude, like --review-budget=200.`);
  }
  return Number(brut);
}

function decrire(c: CellulePlacee, m: MesureRevues): string[] {
  const l: string[] = [];
  l.push(`  factor ${c.palier} at threshold ${c.seuil.toFixed(2)}`);
  l.push(`  recall on confirmed escalations  ${(c.rappel.rate * 100).toFixed(1)} % `
    + `[${(c.rappel.low * 100).toFixed(0)}–${(c.rappel.high * 100).toFixed(0)}], n=${c.rappel.n}`);
  l.push(`  false-alert rate on maintained   ${(c.faussesAlertes.rate * 100).toFixed(1)} % `
    + `[${(c.faussesAlertes.low * 100).toFixed(0)}–${(c.faussesAlertes.high * 100).toFixed(0)}], n=${c.faussesAlertes.n}`);
  l.push(`  reviews raised on this history   ${c.tirees} of ${m.source.reviews}`);
  if (c.pourMille !== undefined) l.push(`  reviews per thousand customers   ${c.pourMille}`);
  return l;
}

async function principal(): Promise<void> {
  refuserDrapeauxInconnus(["--from", "--recall", "--review-budget"]);
  const arg = (nom: string) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.split("=").slice(1).join("=");

  const chemin = arg("from");
  const brutRappel = arg("recall");
  const brutBudget = arg("review-budget");
  if (!chemin || (brutRappel === undefined && brutBudget === undefined)) {
    console.log(`
The frontier, from a sealed measurement:

  npm run optimise -- --from=<file>-measured.json --recall=<min>
      among cells whose recall LOWER BOUND holds <min>: the fewest false alerts

  npm run optimise -- --from=<file>-measured.json --review-budget=<N>
      the highest bounded recall under N reviews per month

The record comes from: npm run measure:yours -- --customers=<csv> --reviews=<csv>
`);
    process.exit(2);
  }
  if (brutRappel !== undefined && brutBudget !== undefined) {
    console.error(`\nGive --recall OR --review-budget, not both: they are the two directions of the\n`
      + `  same frontier, and answering both at once would answer neither.\n`);
    process.exit(2);
  }

  const m = lireReleve(chemin);
  const cellules = cellulesDe(m);
  console.log(`\n${m.source.reviews} review(s) measured on ${m.measuredAt.slice(0, 10)}, seal ${m.empreinte} — `
    + `${Object.keys(m.paliers).length} factor(s) × ${new Set(cellules.map((c) => c.seuil)).size} thresholds.`);
  if (m.absents.length) console.log(`contract factor(s) absent from that record: ${m.absents.join(", ")}`);

  if (m.source.escalated < MINIMUM_ESCALADES) {
    console.error(`\n${m.source.escalated} confirmed escalation(s) in the record: too few confirmed\n`
      + `  cases to bound recall (the contract cites and optimises recall from ${MINIMUM_ESCALADES}). Export a\n`
      + `  longer window of history and re-measure.\n`);
    process.exit(2);
  }

  if (brutRappel !== undefined) {
    const min = lireRappelMin(brutRappel);
    const c = meilleureSousRappel(cellules, min);
    if (!c) {
      const borne = plusForteBorne(cellules);
      console.error(`\nNo cell holds a recall lower bound of ${min} on this sample `
        + `(${m.source.escalated} confirmed escalations).`);
      console.error(borne === null
        ? `  No cell has enough confirmed cases to bound recall at all.`
        : `  The strongest bound available is ${(borne * 100).toFixed(0)} % — lower the floor,`
          + ` or measure a wider window.`);
      console.error("");
      process.exit(1);
    }
    console.log(`\nFewest false alerts with the recall lower bound at or above ${min}:\n`);
    for (const l of decrire(c, m)) console.log(l);
    const economisees = m.source.reviews - c.tirees;
    const h = heuresDAnalyste(economisees);
    console.log(`\nAgainst your current programme's history: ${economisees} review(s) fewer over the`);
    console.log(`file's period, ${h.heures.toFixed(1)} analyst hour(s), ${symboleDe(UNITS.analystAnnualCost)}${h.usd.toFixed(0)} — computed from:`);
    console.log(`  ${ligneDHypothese("minutesPerReview")}`);
    console.log(`  ${ligneDHypothese("analystAnnualCost")} over ${ASSUMPTIONS.workingDaysPerYear} days × ${ASSUMPTIONS.productiveHoursPerDay} h`);
    console.log(`Change the assumptions and the dollars move; the recall bound does not.\n`);
    return;
  }

  const budget = lireBudget(brutBudget!);
  if (!m.source.periode || m.source.periode.jours <= 0) {
    console.error(`\n--review-budget is a MONTHLY figure, and the record carries no readable\n`
      + `  period. Re-measure, or use --recall instead.\n`);
    process.exit(2);
  }
  const c = meilleureSousBudget(cellules, budget, m.source.periode.jours);
  if (!c) {
    console.error(`\nNo cell fits ${budget} review(s) per month on this history\n`
      + `  (period measured: ${m.source.periode.jours} day(s)). Raise the budget, or accept an\n`
      + `  unbounded recall.\n`);
    process.exit(1);
  }
  console.log(`\nHighest bounded recall under ${budget} review(s) per month `
    + `(period: ${m.source.periode.from} to ${m.source.periode.to}, ${m.source.periode.jours} day(s)):\n`);
  for (const l of decrire(c, m)) console.log(l);
  if (c.rappel.low === 0) {
    console.log(`\n  ⚠ the best recall this budget buys is bounded at ZERO: under ${budget} review(s)`);
    console.log(`    per month, no cell retains any guaranteed recall. Raise the budget before`);
    console.log(`    reading anything else here.`);
  }
  console.log(`  reviews per month at this cell   ${(c.tirees * (30 / m.source.periode.jours)).toFixed(0)}`);
  const h = heuresDAnalyste(c.tirees * (30 / m.source.periode.jours));
  console.log(`\nConcluding them costs ${h.heures.toFixed(1)} analyst hour(s) per month, ${symboleDe(UNITS.analystAnnualCost)}${h.usd.toFixed(0)} — computed from:`);
  console.log(`  ${ligneDHypothese("minutesPerReview")}`);
  console.log(`  ${ligneDHypothese("analystAnnualCost")} over ${ASSUMPTIONS.workingDaysPerYear} days × ${ASSUMPTIONS.productiveHoursPerDay} h\n`);
}

if (isMain(import.meta)) {
  try {
    await principal();
  } catch (e) {
    console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  }
}
