#!/usr/bin/env node
/**
 * Re-checks that every protein component in src/organelle/blueprints.ts cites a REAL entry
 * (TSK-UI-007): PDB ids against the RCSB data API, UniProt accessions against rest.uniprot.org.
 * Prints each entry's title/organism so the cited source text can be compared by eye.
 *
 *   node scripts/verify-organelle-structures.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/organelle/blueprints.ts'), 'utf8');
const refs = [...src.matchAll(/C\('([^']+)',\s*'([^']+)',\s*'(PDB|UniProt)',\s*'([^']+)'/g)].map((m) => ({ id: m[1], name: m[2], db: m[3], ref: m[4] }));
let bad = 0;

const pdb = refs.filter((r) => r.db === 'PDB');
const q = `{entries(entry_ids:${JSON.stringify(pdb.map((r) => r.ref))}){rcsb_id struct{title} polymer_entities{rcsb_entity_source_organism{scientific_name}}}}`;
const res = await fetch('https://data.rcsb.org/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: q }) });
const found = new Map(((await res.json()).data?.entries ?? []).map((e) => [e.rcsb_id, e]));
for (const r of pdb) {
  const e = found.get(r.ref);
  if (!e) {
    bad++;
    console.log(`MISSING  PDB ${r.ref}  ${r.name}`);
    continue;
  }
  const orgs = [...new Set((e.polymer_entities ?? []).flatMap((p) => (p.rcsb_entity_source_organism ?? []).map((o) => o.scientific_name)))].slice(0, 2);
  console.log(`ok  PDB ${r.ref}  ${r.name.padEnd(42)} | ${e.struct.title.slice(0, 70)} | ${orgs.join(', ')}`);
}
for (const r of refs.filter((x) => x.db === 'UniProt')) {
  const u = await fetch(`https://rest.uniprot.org/uniprotkb/${r.ref}.json?fields=protein_name,organism_name,gene_names`);
  if (!u.ok) {
    bad++;
    console.log(`MISSING  UniProt ${r.ref}  ${r.name}`);
    continue;
  }
  const j = await u.json();
  console.log(`ok  UniProt ${r.ref}  ${r.name.padEnd(38)} | ${j.proteinDescription?.recommendedName?.fullName?.value} | ${j.organism?.scientificName}`);
}
console.log(`\n${refs.length - bad}/${refs.length} references resolved`);
process.exit(bad ? 1 : 0);
