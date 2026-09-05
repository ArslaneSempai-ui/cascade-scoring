/**
 * La mesure client de l'améthyste, éprouvée contre un REGISTRE FACTICE conforme à
 * facteur.ts : les vrais facteurs appartiennent au lot A-L1. Le facteur factice lit son
 * score DANS le dossier : le cashRatio, un champ [0, 1] que chaque test contrôle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  lireRevues, lireClients, reconstruire, mesurer, executer, lireVolume,
  MINIMUM_REVUES, type Revue,
} from "./your-reviews.ts";
import { rendreRapport, TROP_PEU_D_ESCALADES, NOTE_PETIT_N } from "./rapport.ts";
import { scelleIntact, empreinteDuReleve } from "./empreinte.ts";
import { TABLES, tablesAvec } from "./assumptions.ts";
import type { Registre, Facteur, PalierId } from "./facteur.ts";

export function registreFactice(ids: PalierId[] = ["geography", "behaviour"]): Registre {
  return new Map(ids.map((id, i) => [id, {
    id, description: `fake ${id} for the seam tests`, rang: i + 1,
    tablesLues: ["comportement"] as const,
    /* geography factice : 0 sans nationalité — pour éprouver le compte « sans
       nationalité » sans attendre le lot A-L1 ; sinon comme behaviour */
    score: (d) => (id === "geography" && d.nationality === undefined) ? 0 : d.cashRatio,
  } as Facteur]));
}

const ENTETE_R = "review_id,customer_id,reviewed_at,outcome";
const ENTETE_C = ("customer_id,kind,residence_country,activity_code,products,pep,"
  + "onboarding_channel,relationship_start,declared_turnover,observed_turnover,"
  + "cash_ratio,cross_border_ratio,nationality_country,ownership_layers,beneficial_owner_named");

function ligneClient(id: string, cash: string, nat = "FR"): string {
  return `${id},individual,FR,salaried,card;wire,none,branch,2020-01-01,50000,48000,${cash},0.1,${nat},,`;
}

/** n revues : e escaladées (cashRatio donnés), le reste maintenu à 0,40. */
function jeu(cashEscalades: number[], nMaintenues: number): { revues: string; clients: string } {
  const r: string[] = [ENTETE_R];
  const c: string[] = [ENTETE_C];
  cashEscalades.forEach((s, i) => {
    r.push(`e-${i},cli-e${i},2026-08-30,escalated`);
    c.push(ligneClient(`cli-e${i}`, String(s)));
  });
  for (let i = 0; i < nMaintenues; i++) {
    r.push(`m-${i},cli-m${i},2026-0${(i % 3) + 6}-15,maintained`);
    c.push(ligneClient(`cli-m${i}`, "0.4"));
  }
  return { revues: r.join("\n") + "\n", clients: c.join("\n") + "\n" };
}

function mesureDe(cashEscalades: number[], nMaintenues: number, volume?: number) {
  const { revues, clients } = jeu(cashEscalades, nMaintenues);
  const { revues: r } = lireRevues(revues);
  const { parClient } = lireClients(clients);
  return mesurer(r, parClient, registreFactice(), {
    reviews: "r.csv", reviewsSha: "0".repeat(64), customers: "c.csv", customersSha: "1".repeat(64), customersRows: parClient.size,
  }, volume ? { origine: "volume", n: volume } : null);
}

/* ─── les refus du contrat ─── */

test("colonne manquante et colonne inconnue : refusées en les nommant, chaque fichier", () => {
  assert.throws(() => lireRevues("review_id,customer_id,outcome\n1,a,maintained\n"),
    /reviews header is missing "reviewed_at"/);
  assert.throws(() => lireRevues(ENTETE_R + ",note\n1,a,2026-01-01,maintained,x\n"), /"note"/);
  assert.throws(() => lireClients("customer_id,kind\na,individual\n"),
    /customers header is missing/);
});

test("l'outcome se lit sans casse ; le hors-vocabulaire est refusé avec ligne et valeur", () => {
  const lignes = [ENTETE_R];
  for (let i = 0; i < 30; i++) lignes.push(`c-${i},cli,2026-08-30,${i === 0 ? "Escalated" : "MAINTAINED"}`);
  const { revues } = lireRevues(lignes.join("\n") + "\n");
  assert.equal(revues[0]!.outcome, "escalated");
  assert.equal(revues[1]!.outcome, "maintained");
  assert.throws(() => lireRevues(ENTETE_R + "\n1,a,2026-01-01,Pending\n"), /line 2: "Pending"/);
});

test("dates illisibles, ids vides, review_id dupliqué (lignes tronquées), moins de 30 : refusés", () => {
  assert.throws(() => lireRevues(ENTETE_R + "\n1,a,30/08/2026,maintained\n"), /unreadable reviewed_at/);
  assert.throws(() => lireRevues(ENTETE_R + "\n1,,2026-01-01,maintained\n"), /empty review_id or customer_id/);
  const doubles = [ENTETE_R];
  for (let i = 0; i < 31; i++) doubles.push(`meme,cli,2026-08-30,maintained`);
  assert.throws(() => lireRevues(doubles.join("\n") + "\n"), /rows 2, 3, 4, 5, 6, 7, 8, 9, and 23 more/);
  assert.throws(() => lireRevues(ENTETE_R + "\n1,a,2026-01-01,maintained\n"),
    new RegExp(`at least ${MINIMUM_REVUES}`));
});

test("clients : vocabulaires, ratios, montants et champs d'entité refusés en les nommant", () => {
  const cas = (ligne: string, motif: RegExp) =>
    assert.throws(() => lireClients(ENTETE_C + "\n" + ligne + "\n"), motif);
  cas("a,robot,FR,x,card,none,branch,2020-01-01,100,50,0.1,0.1,FR,,", /kind outside individual\/entity/);
  cas("a,individual,FR,x,card,tsar,branch,2020-01-01,100,50,0.1,0.1,FR,,", /pep outside/);
  cas("a,individual,FR,x,yacht,none,branch,2020-01-01,100,50,0.1,0.1,FR,,", /products list outside/);
  cas("a,individual,FR,x,card,none,telepathy,2020-01-01,100,50,0.1,0.1,FR,,", /onboarding_channel outside/);
  cas("a,individual,FR,x,card,none,branch,2020-01-01,100,50,1.2,0.1,FR,,", /cash_ratio outside \[0, 1\]/);
  cas("a,individual,FR,x,card,none,branch,2020-01-01,100,50,,0.1,FR,,", /cash_ratio outside \[0, 1\]/,);
  cas("a,individual,FR,x,card,none,branch,2020-01-01,0,50,0.1,0.1,FR,,", /non-positive or unreadable declared_turnover/);
  cas("a,individual,FR,x,card,none,branch,2020-01-01,100,-5,0.1,0.1,FR,,", /negative or unreadable observed_turnover/);
  cas("a,entity,FR,x,card,none,branch,2020-01-01,100,50,0.1,0.1,FR,,", /entity without ownership_layers/);
  cas("a,entity,FR,x,card,none,branch,2020-01-01,100,50,0.1,0.1,FR,3,", /entity without beneficial_owner_named/);
});

test("une revue sans client est un refus qui NOMME les revues orphelines", () => {
  const { revues, clients } = jeu([0.9, 0.9, 0.9, 0.9, 0.9], 25);
  const { revues: r } = lireRevues(revues);
  const { parClient } = lireClients(clients);
  parClient.delete("cli-e0");
  assert.throws(() => mesurer(r, parClient, registreFactice(), {
    reviews: "r.csv", reviewsSha: "0".repeat(64), customers: "c.csv", customersSha: "1".repeat(64), customersRows: 1,
  }, null), /no matching customer row[\s\S]*e-0/);
});

/* ─── la reconstruction et les comptes à part ─── */

test("l'ancienneté se compte au jour de la revue, et « sans nationalité » voyage à part", () => {
  const { revues, clients } = jeu([0.9, 0.9, 0.9, 0.9, 0.9, 0.9], 24);
  const { revues: r } = lireRevues(revues);
  const { parClient } = lireClients(clients.replace(ligneClient("cli-e0", "0.9"), ligneClient("cli-e0", "0.9", "")))
  const d = reconstruire(r[0]!, parClient.get("cli-e0")!);
  assert.equal(d.relationshipDays, Math.round((Date.parse("2026-08-30") - Date.parse("2020-01-01")) / 86_400_000));
  assert.equal(d.nationality, undefined);
  const m = mesurer(r, parClient, registreFactice(), {
    reviews: "r.csv", reviewsSha: "0".repeat(64), customers: "c.csv", customersSha: "1".repeat(64), customersRows: parClient.size,
  }, null);
  assert.equal(m.source.sansNationalite, 1);
  assert.equal(m.verdicts["e-0"]!.sansNationalite, true);
  assert.equal(m.verdicts["e-0"]!.scores.geography, 0, "le geography factice rend 0 sans nationalité");
  assert.ok(m.verdicts["e-0"]!.scores.behaviour! > 0.8, "un facteur non géographique note quand même");
});

/* ─── la grille ─── */

test("rappel et fausses alertes comptent les bonnes populations, au bon seuil, >= inclus", () => {
  const m = mesureDe([0.9, 0.9, 0.8, 0.7, 0.6, 0.55], 24);
  const c85 = m.paliers.behaviour!.cellules.find((c) => c.seuil === 0.85)!;
  assert.deepEqual([c85.rappel.successes, c85.rappel.n], [2, 6]);
  assert.deepEqual([c85.faussesAlertes.successes, c85.faussesAlertes.n], [0, 24]);
  const c55 = m.paliers.behaviour!.cellules.find((c) => c.seuil === 0.55)!;
  assert.deepEqual([c55.rappel.successes, c55.rappel.n], [6, 6], "0,55 compte la revue à 0,55 : >= est la règle");
  assert.equal(c55.pourMille, undefined, "sans volume, la colonne n'existe pas");
});

test("le volume rend les revues pour mille clients ; les facteurs absents sont dits", () => {
  const m = mesureDe([0.9, 0.9, 0.9, 0.9, 0.9, 0.9], 24, 10_000);
  const c85 = m.paliers.behaviour!.cellules.find((c) => c.seuil === 0.85)!;
  assert.equal(c85.pourMille, (c85.tirees / 10_000) * 1000);
  assert.ok(m.absents.includes("structure") && m.absents.includes("tenure"));
  assert.match(rendreRapport(m), /absent from the registry/);
});

test("--volume et --tables se lisent strictement", () => {
  assert.equal(lireVolume("50000"), 50_000);
  for (const brut of ["", "0", "1e3", "0x50", "12.5"]) {
    assert.throws(() => lireVolume(brut), /not a number of customers/);
  }
  assert.throws(() => tablesAvec("pas du json"), /not readable JSON/);
  assert.throws(() => tablesAvec('{"paysTresRisque": {}}'), /unknown table\(s\): "paysTresRisque"/);
  assert.throws(() => tablesAvec('{"paysRisque": {"XX": 1.4}}'), /outside \[0, 1\]: paysRisque=1.4|XX=1.4/);
  const t = tablesAvec('{"paysRisque": {"XX": 0.9}}');
  assert.deepEqual(t.paysRisque, { XX: 0.9 }, "une clé donnée remplace la table ENTIÈRE");
  assert.deepEqual(t.produitRisque, TABLES.produitRisque, "les tables non données restent déclarées");
});

/* ─── les trois zones du rappel ─── */

test("les zones du rappel : 4 escalades pas citées, 6 citées avec la note, 25 sans elle", () => {
  const rendu = (n: number) => rendreRapport(mesureDe(Array(n).fill(0.9), 30));
  assert.match(rendu(4), new RegExp(TROP_PEU_D_ESCALADES));
  const r6 = rendu(6);
  assert.match(r6, /100\.0 % \| \[61–100\]/);
  assert.match(r6, new RegExp(NOTE_PETIT_N));
  const r25 = rendu(25);
  assert.match(r25, /100\.0 % \| \[87–100\]/);
  assert.doesNotMatch(r25, new RegExp(NOTE_PETIT_N));
});

/* ─── never a value, avec témoin ─── */

test("le relevé et le rapport ne portent AUCUNE valeur du client, et le détecteur sait voir", () => {
  /* « NZ » et non « KY » : KY vit dans la TABLE DÉCLARÉE, photographiée dans le relevé
     par construction : le témoin l'a trouvé et il avait raison de chercher : la sentinelle
     du client doit être un pays hors table, sinon le test accuse la photographie. */
  const SENTINELLES = ["CLI-SENTINELLE-9", "NZ", "casino-sentinelle", "987654.32"];
  const d = mkdtempSync(join(tmpdir(), "amethyste-"));
  const cheminR = join(d, "revues.csv");
  const cheminC = join(d, "clients.csv");
  const r = [ENTETE_R]; const c = [ENTETE_C];
  for (let i = 0; i < 30; i++) {
    const cli = `${SENTINELLES[0]}-${i}`;
    r.push(`rv-${i},${cli},2026-08-30,${i < 6 ? "escalated" : "maintained"}`);
    c.push(`${cli},individual,${SENTINELLES[1]},${SENTINELLES[2]},card;wire,none,branch,2020-01-01,${SENTINELLES[3]},48000,0.5,0.1,${SENTINELLES[1]},,`);
  }
  writeFileSync(cheminR, r.join("\n") + "\n");
  writeFileSync(cheminC, c.join("\n") + "\n");
  const { cheminMd, cheminJson, mesure } = executer(cheminR, cheminC, registreFactice(), null);
  for (const fichier of [cheminMd, cheminJson]) {
    const emis = readFileSync(fichier, "utf8");
    for (const s of SENTINELLES) {
      assert.ok(!emis.includes(s),
        `« ${s} » sort du fichier du client vers ${fichier} : « never a value » vient de devenir faux.`);
    }
    assert.ok(!emis.includes(d), "le chemin absolu ne sort pas non plus : basename seul");
  }
  assert.ok(JSON.stringify({ fuite: SENTINELLES[0] }).includes(SENTINELLES[0]!));
  assert.equal(mesure.verdicts["rv-0"]!.outcome, "escalated");
  assert.ok(typeof mesure.verdicts["rv-0"]!.scores.behaviour === "number");
});

/* ─── le scellé et les tables photographiées ─── */

test("le relevé est scellable, une retouche le fait mentir, et il photographie ses tables", () => {
  const m = mesureDe([0.9, 0.9, 0.9, 0.9, 0.9, 0.9], 24);
  m.empreinte = empreinteDuReleve(m);
  assert.ok(scelleIntact(m as unknown as Record<string, unknown>));
  const copie = JSON.parse(JSON.stringify(m)) as typeof m;
  copie.source.escalated = 25;
  assert.ok(!scelleIntact(copie as unknown as Record<string, unknown>));
  assert.deepEqual(m.tables, TABLES, "les changer change les scores : elles voyagent scellées");
});
