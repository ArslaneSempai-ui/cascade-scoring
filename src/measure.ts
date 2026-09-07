/**
 * LA MESURE PUBLIQUE DE L'AMÉTHYSTE — celle que NOUS publions, sans aucune donnée client.
 *
 * Aucun vrai client de banque n'est public, et ce relevé le DIT en toutes lettres : ce qui
 * est mesuré ici est écrit et généré. Deux moitiés, tenues À PART et jamais fusionnées :
 *
 *   — les dossiers ÉCRITS par nous (`src/dossiers-etiquetes.json`, lot A-L2), déclarés
 *     `authored` : des archétypes de risque ET leurs sosies bénins — la valeur du jeu
 *     tient aux sosies, une boulangerie à espèces ressemble de loin à un commerce qui
 *     blanchit ;
 *   — les variantes GÉNÉRÉES à graine (`synthetic.ts`, lot A-L2), déclarées `synthetic` :
 *     montants, ratios et ancienneté gigués, pays et produits permutés dans leur classe,
 *     structure préservée, graine fixe écrite ici.
 *
 * Deux verdicts par cellule (facteur × seuil) : le RAPPEL sur les dossiers `escalated` et
 * le taux de FAUSSES ALERTES sur les `maintained`, toujours avec n et Wilson. Le relevé
 * photographie aussi les TABLES déclarées sous lesquelles il a été mesuré (l'hypothèse la
 * plus bruyante de cet outil, dit le contrat) : les changer change les scores, donc elles
 * font partie du chiffre.
 *
 * Le relevé va À LA RACINE, scellé (`releve-public.json` + `RELEVE-PUBLIC.md`) ; le
 * réécrire demande `--yes-overwrite`. Les absents du registre sont DÉRIVÉS, jamais récités.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { isMain, refuserDrapeauxInconnus } from "./cli.ts";
import { registre as registreDesFacteurs } from "./facteurs/index.ts";
import { SEUILS, PALIERS, exigerScore, type Registre, type Tables } from "./facteur.ts";
import { rate, type Rate } from "./interval.ts";
import { empreinteDuReleve, scelleIntact } from "./empreinte.ts";
import { chargerDossiersEtiquetes, jeuSynthetique, NATURES_ESCALATED, type DossierEtiquete } from "./synthetic.ts";
import { ASSUMPTIONS, TABLES } from "./assumptions.ts";
import { meilleureSousRappel, type CellulePlacee } from "./optimise.ts";

/** La graine de la moitié synthétique, et son ampleur : écrites ici pour que deux
 *  lancements du même arbre scellent le MÊME relevé (le déterminisme est un témoin). */
export const GRAINE_PUBLIQUE = 20_260_908;
export const VARIANTES_PAR_DOSSIER = 3;

/** Le minimum de dossiers PAR issue (contrat §4) : en dessous, le jeu ne borne rien. */
export const ASSEZ_PAR_ISSUE = 40;

export const estEscalade = (d: DossierEtiquete): boolean =>
  (NATURES_ESCALATED as readonly string[]).includes(d.nature);

/** Une cellule du relevé : le taux avec tout ce qu'il faut pour le relire. */
export type Cellule = { succes: number; n: number; taux: number; bas: number; haut: number };
const cellule = (r: Rate): Cellule =>
  ({ succes: r.successes, n: r.n, taux: r.rate, bas: r.low, haut: r.high });

export type TableDUnFacteur = Record<string, { rappel: Cellule; fauxPositifs: Cellule }>;

/**
 * La mesure elle-même : chaque facteur note chaque dossier UNE fois (le score passe par
 * `exigerScore`), la grille de seuils relit les scores. Pure — le registre, les dossiers
 * et les tables entrent, la grille sort — pour qu'un témoin puisse la nourrir d'un facteur
 * scripté et refaire l'arithmétique à la main.
 */
export function mesurerDossiers(
  r: Registre, dossiers: readonly DossierEtiquete[], tables: Tables,
): Record<string, TableDUnFacteur> {
  const sortie: Record<string, TableDUnFacteur> = {};
  for (const [id, f] of r) {
    const notes = dossiers.map((d) => ({ escalade: estEscalade(d), score: exigerScore(f.score(d, tables), id, d) }));
    const escalades = notes.filter((x) => x.escalade);
    const maintenus = notes.filter((x) => !x.escalade);
    const table: TableDUnFacteur = {};
    for (const seuil of SEUILS) {
      table[seuil.toFixed(2)] = {
        rappel: cellule(rate(escalades.filter((x) => x.score >= seuil).length, escalades.length)),
        fauxPositifs: cellule(rate(maintenus.filter((x) => x.score >= seuil).length, maintenus.length)),
      };
    }
    sortie[id] = table;
  }
  return sortie;
}

export type MoitiePublique = {
  provenance: string;
  nEscalated: number;
  nMaintained: number;
  natures?: Record<string, number>;
  tables: Record<string, TableDUnFacteur>;
};

export type MesurePublique = {
  version: 1;
  date: string;
  commit: string;
  paliers: { presents: string[]; absents: string[] };
  authored: MoitiePublique & { natures: Record<string, number> };
  synthetic: MoitiePublique;
  /** la photo des TABLES déclarées sous lesquelles ce relevé a été mesuré : les changer change les scores */
  tables: Tables;
  empreinte?: string;
};

/** La phrase du contrat, en toutes lettres, dans les DEUX provenances et dans le md. */
export const PHRASE_PROVENANCE = "no real bank customer is public: written and generated, and it says so";

/**
 * Le jeu d'une moitié, validé avant toute mesure : assez de dossiers de CHAQUE issue, et
 * pas de fuite d'une moitié dans l'autre. La convention d'identifiant des variantes est
 * celle du message de livraison du lot A-L2 (`<id>~v<n>`).
 */
export function validerMoitie(dossiers: readonly DossierEtiquete[], moitie: "authored" | "synthetic"): void {
  const nEscalades = dossiers.filter(estEscalade).length;
  const nMaintenus = dossiers.length - nEscalades;
  if (nEscalades < ASSEZ_PAR_ISSUE || nMaintenus < ASSEZ_PAR_ISSUE) {
    throw new Error(`${moitie}: ${nEscalades} escalated / ${nMaintenus} maintained dossier(s): at least `
      + `${ASSEZ_PAR_ISSUE} of EACH.\n  Below that, a rate here bounds nothing, and the missing side is`
      + ` usually the benign look-alikes,\n  which are what the set is for.`);
  }
  const intrus = dossiers.filter((d) => (moitie === "authored") === d.id.includes("~v"));
  if (intrus.length > 0) {
    throw new Error(`${intrus.length} dossier(s) in the ${moitie} half carry the ${moitie === "authored" ? "" : "wrong "}variant marker "~v"`
      + ` (first: "${intrus[0]!.id}").\n  The two halves are measured APART and never merged: a merged set would launder a\n`
      + `  synthetic figure into an authored one. Nothing was measured.`);
  }
}

/**
 * Le relevé complet, PUR : les deux jeux, le registre, les tables, la date et le commit
 * entrent ; le relevé sort, sans scellé (le scellé est le geste de la commande). Les
 * absents se DÉRIVENT du registre reçu.
 */
export function construireReleve(
  ecrits: readonly DossierEtiquete[], synthetiques: readonly DossierEtiquete[],
  r: Registre, tables: Tables, date: string, commit: string,
): MesurePublique {
  validerMoitie(ecrits, "authored");
  validerMoitie(synthetiques, "synthetic");
  const natures: Record<string, number> = {};
  for (const d of ecrits) natures[d.nature] = (natures[d.nature] ?? 0) + 1;
  return {
    version: 1, date, commit,
    paliers: {
      presents: [...r.keys()],
      absents: PALIERS.filter((p) => !r.has(p)),
    },
    authored: {
      provenance: `written by hand in this repository: archetypes of risk and their benign look-alikes; ${PHRASE_PROVENANCE}`,
      nEscalated: ecrits.filter(estEscalade).length,
      nMaintained: ecrits.filter((d) => !estEscalade(d)).length,
      natures,
      tables: mesurerDossiers(r, ecrits, tables),
    },
    synthetic: {
      provenance: `seeded variants of the authored dossiers (seed ${GRAINE_PUBLIQUE}, ${VARIANTES_PAR_DOSSIER} per dossier), structure preserved; ${PHRASE_PROVENANCE}`,
      nEscalated: synthetiques.filter(estEscalade).length,
      nMaintained: synthetiques.filter((d) => !estEscalade(d)).length,
      tables: mesurerDossiers(r, synthetiques, tables),
    },
    tables,
  };
}

/**
 * La cellule que LA RÈGLE DE L'OUTIL retient sur la moitié écrite — la même règle
 * qu'`optimise` (meilleureSousRappel IMPORTÉE, jamais restituée de mémoire) : borne basse
 * du rappel ≥ l'exigence, puis le moins de fausses alertes, puis le moins de revues
 * levées, puis le facteur le moins cher, puis le seuil le plus strict. Les Rate sont
 * RECOMPOSÉS par rate(succes, n) depuis les comptes bruts : la même recomposition que
 * l'extracteur du site exigera, exercée ici en premier.
 */
export function celluleRecommandee(
  m: MesurePublique, r: Registre, rappelMin: number = ASSUMPTIONS.recallFloor,
): CellulePlacee | null {
  const cellules: CellulePlacee[] = [];
  for (const [palier, table] of Object.entries(m.authored.tables)) {
    const rang = r.get(palier as (typeof PALIERS)[number])!.rang;
    for (const [seuil, c] of Object.entries(table)) {
      cellules.push({
        palier: palier as (typeof PALIERS)[number], rang, seuil: Number(seuil),
        tirees: c.rappel.succes + c.fauxPositifs.succes,
        rappel: rate(c.rappel.succes, c.rappel.n),
        faussesAlertes: rate(c.fauxPositifs.succes, c.fauxPositifs.n),
      });
    }
  }
  return meilleureSousRappel(cellules, rappelMin);
}

/* ─── le rapport lisible ─── */

/** Les seuils MONTRÉS dans le md ; la grille entière vit dans le json, et la ligne le dit. */
export const SEUILS_MONTRES = [0.50, 0.60, 0.70, 0.80, 0.85, 0.90, 0.95, 1.00] as const;

const pc = (c: Cellule) => `${(c.taux * 100).toFixed(0)}% [${(c.bas * 100).toFixed(0)}-${(c.haut * 100).toFixed(0)}]`;

function tableMd(tables: Record<string, TableDUnFacteur>, quoi: "rappel" | "fauxPositifs"): string {
  const entete = `| factor | ${SEUILS_MONTRES.map((s) => s.toFixed(2)).join(" | ")} |`;
  const barre = `|---|${SEUILS_MONTRES.map(() => "---").join("|")}|`;
  const lignes = Object.entries(tables).map(([id, t]) =>
    `| \`${id}\` | ${SEUILS_MONTRES.map((s) => pc(t[s.toFixed(2)]![quoi])).join(" | ")} |`);
  return [entete, barre, ...lignes].join("\n");
}

export function rapportMd(m: MesurePublique, recommandee: CellulePlacee | null): string {
  const l: string[] = [
    `# Cascade Scoring: the public measure`,
    ``,
    `**Provenance**: ${PHRASE_PROVENANCE}. Dossiers written by this repository (archetypes of`,
    `risk and their benign look-alikes) plus seeded, structure-preserving variants, measured`,
    `APART and never merged. Commit \`${m.commit}\`, ${m.date}. Sealed as \`releve-public.json\`;`,
    `every rate below carries its n and its 95 % Wilson interval, and the FULL threshold grid`,
    `(${SEUILS.length} steps) lives in the JSON; this page shows ${SEUILS_MONTRES.length} declared columns of it. The`,
    `record also photographs the declared risk TABLES it was measured under (\`tables\`), the`,
    `loudest assumption of this tool, replaceable by yours: change a table and the scores`,
    `move with it.`,
    ``,
    `Factors measured: ${m.paliers.presents.map((p) => `\`${p}\``).join(", ")}.`
    + (m.paliers.absents.length
      ? ` **Not in tonight's registry: ${m.paliers.absents.map((p) => `\`${p}\``).join(", ")}**. Measured when it ships, absent rather than faked.`
      : ` An eighth, learned factor is named ABSENT from day one: it will come or it will not, it will never be guessed.`),
    ``,
    `## Written dossiers (authored): ${m.authored.nEscalated} escalated, ${m.authored.nMaintained} maintained`,
    ``,
    `The set's value is its benign look-alikes: a cash-heavy neighbourhood bakery looks, from`,
    `afar, like a laundering shopfront. Natures: ${Object.entries(m.authored.natures).map(([k, n]) => `${k} x${n}`).join(", ")}.`,
    ``,
    `### Recall on the escalated dossiers (higher is safer)`,
    ``, tableMd(m.authored.tables, "rappel"), ``,
    `### False alerts on the maintained look-alikes (every point is review minutes)`,
    ``, tableMd(m.authored.tables, "fauxPositifs"), ``,
    `## Generated variants (synthetic): ${m.synthetic.nEscalated} escalated, ${m.synthetic.nMaintained} maintained`,
    ``,
    `Seeded, declared, never merged with the written set.`,
    ``, `### Recall`, ``, tableMd(m.synthetic.tables, "rappel"), ``,
    `### False alerts`, ``, tableMd(m.synthetic.tables, "fauxPositifs"), ``,
    `## The cell the tool's own rule retains`,
    ``,
    recommandee
      ? `Under a recall LOWER BOUND of ${(ASSUMPTIONS.recallFloor * 100).toFixed(0)} % on the written dossiers, then fewest false`
        + ` alerts, then fewest reviews raised, then the cheaper factor, then the stricter threshold:`
        + ` \`${recommandee.palier}\` at threshold ${recommandee.seuil.toFixed(2)}, recall ${pc(cellule(recommandee.rappel))},`
        + ` false alerts ${pc(cellule(recommandee.faussesAlertes))}. The rule is \`optimise\`'s, imported, not restated.`
      : `No cell holds a recall lower bound of ${(ASSUMPTIONS.recallFloor * 100).toFixed(0)} % on the written dossiers: said, not hidden.`,
    ``,
    `Generated by \`npm run measure\`; a sealed record refuses silent overwrite.`,
    ``,
  ];
  return l.join("\n");
}

/* ─── la commande ─── */

/**
 * Le droit d'écraser, SORTI de la commande pour porter ses témoins : un relevé scellé
 * intact ne se réécrit que si `--yes-overwrite` est écrit dans la commande ; un relevé
 * absent, ou déjà abîmé, se réécrit sans cérémonie.
 */
export function exigerDroitDEcraser(cheminJson: string, argv: readonly string[]): void {
  if (!existsSync(cheminJson)) return;
  const existant = JSON.parse(readFileSync(cheminJson, "utf8")) as Record<string, unknown>;
  if (scelleIntact(existant) && !argv.includes("--yes-overwrite")) {
    throw new Error(`releve-public.json exists, sealed and intact: it is the PUBLISHED record.\n`
      + `  A published figure does not move because a command was re-run by accident.\n`
      + `  To remeasure and replace it, say so: npm run measure -- --yes-overwrite`);
  }
}

async function principal(): Promise<void> {
  refuserDrapeauxInconnus(["--yes-overwrite"]);
  const racine = fileURLToPath(new URL("..", import.meta.url));
  const cheminJson = racine + "releve-public.json";
  exigerDroitDEcraser(cheminJson, process.argv);
  const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: racine, encoding: "utf8" }).trim();
  const ecrits = chargerDossiersEtiquetes();
  const synthetiques = jeuSynthetique(ecrits, GRAINE_PUBLIQUE, VARIANTES_PAR_DOSSIER);
  const r = registreDesFacteurs();
  const m = construireReleve(ecrits, synthetiques, r, TABLES, new Date().toISOString().slice(0, 10), commit);
  m.empreinte = empreinteDuReleve(m);
  const recommandee = celluleRecommandee(m, r);
  writeFileSync(cheminJson, JSON.stringify(m, null, 1) + "\n");
  writeFileSync(racine + "RELEVE-PUBLIC.md", rapportMd(m, recommandee));
  console.log(`releve-public.json written and sealed (${m.empreinte}); RELEVE-PUBLIC.md alongside.`);
  console.log(`authored: ${m.authored.nEscalated} escalated / ${m.authored.nMaintained} maintained; `
    + `synthetic: ${m.synthetic.nEscalated} / ${m.synthetic.nMaintained}. factors: ${m.paliers.presents.join(", ")}`
    + (m.paliers.absents.length ? `. absent: ${m.paliers.absents.join(", ")}` : ""));
  console.log(recommandee
    ? `recommended under recall lower bound >= ${ASSUMPTIONS.recallFloor}: ${recommandee.palier} at ${recommandee.seuil.toFixed(2)}.`
    : `no cell holds the recall floor of ${ASSUMPTIONS.recallFloor} at the lower bound: said, not hidden.`);
}

if (isMain(import.meta)) {
  try {
    await principal();
  } catch (e) {
    console.error(`\n${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }
}
