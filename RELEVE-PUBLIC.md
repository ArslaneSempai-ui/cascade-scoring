# Cascade Scoring — the public measure

**Provenance**: no real bank customer is public: written and generated, and it says so. Dossiers written by this repository (archetypes of
risk and their benign look-alikes) plus seeded, structure-preserving variants, measured
APART and never merged. Commit `4469413`, 2026-09-05. Sealed as `releve-public.json`;
every rate below carries its n and its 95 % Wilson interval, and the FULL threshold grid
(51 steps) lives in the JSON — this page shows 8 declared columns of it. The
record also photographs the declared risk TABLES it was measured under (`tables`) — the
loudest assumption of this tool, replaceable by yours: change a table and the scores
move with it.

Factors measured: `geography`, `activity`, `product`, `exposure`, `structure`, `behaviour`, `tenure`. An eighth, learned factor is named ABSENT from day one: it will come or it will not, it will never be guessed.

## Written dossiers (authored) — 42 escalated, 42 maintained

The set's value is its benign look-alikes: a cash-heavy neighbourhood bakery looks, from
afar, like a laundering shopfront. Natures: shell-layers x7, pep-relative x7, cash-intensive x7, offshore-structure x7, remote-newcomer-burst x7, undeclared-turnover x7, local-shop x7, salaried x7, domestic-sme x7, retiree x7, foreign-student x7, seasonal-exporter x7.

### Recall on the escalated dossiers (higher is safer)

| factor | 0.50 | 0.60 | 0.70 | 0.80 | 0.85 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|---|---|---|
| `geography` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `activity` | 38% [25-53] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `product` | 93% [81-98] | 93% [81-98] | 43% [29-58] | 17% [8-31] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `exposure` | 26% [15-41] | 17% [8-31] | 7% [2-19] | 7% [2-19] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `structure` | 33% [21-48] | 33% [21-48] | 12% [5-25] | 7% [2-19] | 7% [2-19] | 2% [0-12] | 0% [0-8] | 0% [0-8] |
| `behaviour` | 67% [52-79] | 52% [38-67] | 43% [29-58] | 40% [27-56] | 36% [23-51] | 31% [19-46] | 19% [10-33] | 0% [0-8] |
| `tenure` | 17% [8-31] | 12% [5-25] | 5% [1-16] | 2% [0-12] | 2% [0-12] | 0% [0-8] | 0% [0-8] | 0% [0-8] |

### False alerts on the maintained look-alikes (every point is review minutes)

| factor | 0.50 | 0.60 | 0.70 | 0.80 | 0.85 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|---|---|---|
| `geography` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `activity` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `product` | 24% [13-39] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `exposure` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `structure` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `behaviour` | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |
| `tenure` | 12% [5-25] | 10% [4-22] | 5% [1-16] | 2% [0-12] | 0% [0-8] | 0% [0-8] | 0% [0-8] | 0% [0-8] |

## Generated variants (synthetic) — 126 escalated, 126 maintained

Seeded, declared, never merged with the written set.

### Recall

| factor | 0.50 | 0.60 | 0.70 | 0.80 | 0.85 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|---|---|---|
| `geography` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `activity` | 38% [30-47] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `product` | 79% [71-86] | 55% [46-63] | 29% [22-38] | 9% [5-15] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `exposure` | 26% [19-34] | 17% [11-24] | 7% [4-13] | 7% [4-13] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `structure` | 33% [26-42] | 31% [24-39] | 15% [10-22] | 8% [4-14] | 7% [4-13] | 4% [2-9] | 0% [0-3] | 0% [0-3] |
| `behaviour` | 68% [60-76] | 56% [47-64] | 44% [35-52] | 39% [31-48] | 35% [27-44] | 29% [21-37] | 18% [12-26] | 0% [0-3] |
| `tenure` | 17% [11-24] | 13% [9-21] | 4% [2-9] | 2% [1-7] | 2% [1-7] | 0% [0-3] | 0% [0-3] | 0% [0-3] |

### False alerts

| factor | 0.50 | 0.60 | 0.70 | 0.80 | 0.85 | 0.90 | 0.95 | 1.00 |
|---|---|---|---|---|---|---|---|---|
| `geography` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `activity` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `product` | 35% [27-44] | 26% [19-34] | 11% [7-18] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `exposure` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `structure` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `behaviour` | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] | 0% [0-3] |
| `tenure` | 11% [7-18] | 9% [5-15] | 6% [3-11] | 2% [1-7] | 1% [0-4] | 0% [0-3] | 0% [0-3] | 0% [0-3] |

## The cell the tool's own rule retains

No cell holds a recall lower bound of 90 % on the written dossiers: said, not hidden.

Generated by `npm run measure`; a sealed record refuses silent overwrite.
