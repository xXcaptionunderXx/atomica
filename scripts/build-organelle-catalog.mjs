#!/usr/bin/env node
/**
 * Builds src/organelle/catalog.json (TSK-UI-007): the organelle layer's searchable catalogue of
 * REAL cellular components from the Gene Ontology (CC BY 4.0, geneontology.org), via EBI QuickGO.
 *
 * Contents = every non-obsolete descendant (is_a / part_of) of
 *   GO:0043226 organelle, GO:0005622 intracellular anatomical structure, GO:0032991 protein-containing complex
 * i.e. organelles, their sub-compartments and membranes, and the macromolecular machines inside them.
 * Each term is grouped by organelle family and linked to a buildable ATOMICA blueprint when it is
 * that organelle or one of its parts.
 *
 *   node scripts/build-organelle-catalog.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/organelle/catalog.json');
const CACHE_DIR = join(ROOT, 'scripts/.organelle-cache');
const API = 'https://www.ebi.ac.uk/QuickGO/services/ontology/go';
mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  const key = join(CACHE_DIR, url.replace(/[^a-z0-9]+/gi, '_').slice(-180) + '.json');
  if (existsSync(key)) return JSON.parse(readFileSync(key, 'utf8'));
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'atomica-organelle-builder' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      writeFileSync(key, JSON.stringify(json));
      await sleep(150);
      return json;
    } catch (e) {
      if (i === 4) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}
const descendants = async (id) =>
  new Set([id, ...((await getJson(`${API}/terms/${id}/descendants?relations=is_a,part_of`)).results?.[0]?.descendants ?? [])]);

// ---------- membership ----------
const ROOTS = ['GO:0043226', 'GO:0005622', 'GO:0032991'];
const all = new Set();
for (const r of ROOTS) for (const id of await descendants(r)) all.add(id);
all.delete('GO:0005622'); // "intracellular anatomical structure" itself is not an organelle-scale item

// Organelle families, most specific first (a term takes the first family it descends from).
const GROUPS = [
  ['Mitochondrion', 'GO:0005739'],
  ['Plastid & chloroplast', 'GO:0009536'],
  ['Ribosome', 'GO:0005840'],
  ['Chromosome & chromatin', 'GO:0005694'],
  ['Nucleus', 'GO:0005634'],
  ['Endoplasmic reticulum', 'GO:0005783'],
  ['Golgi apparatus', 'GO:0005794'],
  ['Lysosome', 'GO:0005764'],
  ['Vacuole', 'GO:0005773'],
  ['Peroxisome & microbodies', 'GO:0042579'],
  ['Endosome', 'GO:0005768'],
  ['Lipid droplet', 'GO:0005811'],
  ['Bacterial microcompartments', 'GO:0031469'],
  ['Cilium & flagellum', 'GO:0005929'],
  ['Cytoskeleton & centrosome', 'GO:0005856'],
  ['Vesicles', 'GO:0031982'],
  ['Membraneless organelles & condensates', 'GO:0043228'],
  ['Other membrane-bounded organelles', 'GO:0043227'],
  ['Macromolecular complexes', 'GO:0032991'],
];
const groupSets = [];
for (const [, id] of GROUPS) groupSets.push(await descendants(id));

// Buildable blueprints (src/organelle/blueprints.ts) by GO root.
const BLUEPRINTS = [
  ['mitochondrion', 'GO:0005739'],
  ['chloroplast', 'GO:0009507'],
  ['ribosome', 'GO:0005840'],
  ['nucleus', 'GO:0005634'],
  ['er', 'GO:0005783'],
  ['golgi', 'GO:0005794'],
  ['lysosome', 'GO:0005764'],
  ['peroxisome', 'GO:0005777'],
  ['lipid-droplet', 'GO:0005811'],
  ['carboxysome', 'GO:0031470'],
  ['vesicle', 'GO:0031982'],
];
const blueprintSets = [];
for (const [, id] of BLUEPRINTS) blueprintSets.push(await descendants(id));

// ---------- term details ----------
const ids = [...all].sort();
const terms = [];
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const res = await getJson(`${API}/terms/${batch.join(',')}`);
  terms.push(...(res.results ?? []));
  console.log(`terms ${Math.min(i + 100, ids.length)}/${ids.length}`);
}

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const entries = [];
for (const t of terms) {
  if (t.isObsolete || !all.has(t.id)) continue;
  const g = groupSets.findIndex((set) => set.has(t.id));
  const b = blueprintSets.findIndex((set) => set.has(t.id));
  const def = clean(t.definition?.text);
  const syn = (t.synonyms ?? [])
    .filter((s) => s.type === 'exact' && s.name && s.name.length <= 60)
    .map((s) => s.name)
    .slice(0, 3);
  entries.push({
    id: t.id,
    n: t.name,
    d: def.length > 280 ? `${def.slice(0, 277)}…` : def,
    ...(syn.length ? { s: syn } : {}),
    g: g < 0 ? GROUPS.length - 1 : g,
    ...(b >= 0 ? { b: BLUEPRINTS[b][0] } : {}),
  });
}
entries.sort((a, b) => a.g - b.g || a.n.localeCompare(b.n));
writeFileSync(
  OUT,
  JSON.stringify({
    source: 'Gene Ontology cellular component terms (CC BY 4.0, geneontology.org) via EBI QuickGO; built by scripts/build-organelle-catalog.mjs',
    groups: GROUPS.map(([n]) => n),
    count: entries.length,
    terms: entries,
  }),
);
const counts = GROUPS.map(([n], i) => `${n}: ${entries.filter((e) => e.g === i).length}`);
console.log(`\n${entries.length} terms -> ${OUT}\n${counts.join('\n')}`);
