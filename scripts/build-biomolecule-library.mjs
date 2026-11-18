#!/usr/bin/env node
/**
 * Builds src/chemistry/biomolecules/library.json from names.txt (TSK-UI-005).
 *
 * For every name: PubChem PUG-REST name -> CID, then the 2D SDF record (explicit hydrogens,
 * kekulized bond orders, formal charges) plus a few synonyms for search. PubChem data is public
 * domain. Results are cached in scripts/.biomol-cache so re-runs only fetch new names.
 *
 *   node scripts/build-biomolecule-library.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = join(ROOT, 'src/chemistry/biomolecules/names.txt');
const OUT = join(ROOT, 'src/chemistry/biomolecules/library.json');
const CACHE_DIR = join(ROOT, 'scripts/.biomol-cache');
const CID_CACHE = join(CACHE_DIR, 'cids.json');
const REC_CACHE = join(CACHE_DIR, 'records.json');
const API = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const MAX_ATOMS = 400; // incl. hydrogens; keeps the sandbox responsive

mkdirSync(CACHE_DIR, { recursive: true });
const load = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {});
const cidCache = load(CID_CACHE);
const recCache = load(REC_CACHE);
const saveCaches = () => {
  writeFileSync(CID_CACHE, JSON.stringify(cidCache));
  writeFileSync(REC_CACHE, JSON.stringify(recCache));
};

// ---------- parse names.txt ----------
const entries = [];
let category = 'Other';
for (const raw of readFileSync(NAMES, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('#')) {
    const h = line.slice(1).trim();
    if (h && !/[.:]$/.test(h) && !h.includes('PubChem') && h.length < 60) category = h;
    continue;
  }
  const [label, query] = line.split('|');
  entries.push({ label: label.trim(), query: (query ?? label).trim(), category });
}

// ---------- polite HTTP (PubChem asks for <= 5 requests/s) ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const wait = last + 250 - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'atomica-biomolecule-builder' } });
      if (res.status === 404) return null;
      if (res.status === 503 || res.status === 429) {
        await sleep(2000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

// ---------- 1. names -> CIDs ----------
let done = 0;
for (const e of entries) {
  const key = e.query.toLowerCase();
  if (!(key in cidCache)) {
    const txt = await get(`${API}/compound/name/${encodeURIComponent(e.query)}/cids/TXT`);
    cidCache[key] = txt ? Number(txt.trim().split(/\s+/)[0]) || null : null;
    if (++done % 50 === 0) {
      saveCaches();
      console.log(`resolved ${done} names...`);
    }
  }
  e.cid = cidCache[key];
}
saveCaches();

// ---------- 2. CIDs -> 2D SDF + synonyms ----------
const wanted = [...new Set(entries.map((e) => e.cid).filter((c) => c && !(c in recCache)))];
for (let i = 0; i < wanted.length; i += 40) {
  const batch = wanted.slice(i, i + 40);
  const sdf = await get(`${API}/compound/cid/${batch.join(',')}/SDF?record_type=2d`);
  const syn = await get(`${API}/compound/cid/${batch.join(',')}/synonyms/JSON`);
  const synMap = new Map();
  if (syn) for (const info of JSON.parse(syn).InformationList?.Information ?? []) synMap.set(info.CID, info.Synonym ?? []);
  for (const rec of (sdf ?? '').split('$$$$')) {
    const parsed = parseSdf(rec);
    if (!parsed) continue;
    recCache[parsed.cid] = { ...parsed, synonyms: pickSynonyms(synMap.get(parsed.cid) ?? []) };
  }
  for (const c of batch) if (!(c in recCache)) recCache[c] = null; // e.g. no 2D record
  saveCaches();
  console.log(`structures ${Math.min(i + 40, wanted.length)}/${wanted.length}`);
}

function parseSdf(text) {
  const lines = text.replace(/^\s*\n/, '').split(/\r?\n/);
  const countsIdx = lines.findIndex((l) => /V2000\s*$/.test(l));
  if (countsIdx < 0) return null;
  const nA = Number(lines[countsIdx].slice(0, 3));
  const nB = Number(lines[countsIdx].slice(3, 6));
  const atoms = [];
  for (let i = 0; i < nA; i++) {
    const l = lines[countsIdx + 1 + i];
    const ccc = Number(l.slice(36, 39)) || 0; // legacy charge code
    atoms.push({
      x: Number(l.slice(0, 10)),
      y: Number(l.slice(10, 20)),
      s: l.slice(31, 34).trim(),
      q: ccc ? 4 - ccc : 0,
    });
  }
  const bonds = [];
  for (let i = 0; i < nB; i++) {
    const l = lines[countsIdx + 1 + nA + i];
    const order = Number(l.slice(6, 9));
    bonds.push([Number(l.slice(0, 3)) - 1, Number(l.slice(3, 6)) - 1, order >= 1 && order <= 3 ? order : 1]);
  }
  let chgSeen = false;
  for (const l of lines.slice(countsIdx + 1 + nA + nB)) {
    if (l.startsWith('M  CHG')) {
      if (!chgSeen) for (const a of atoms) a.q = 0; // M CHG supersedes the legacy field
      chgSeen = true;
      const f = l.slice(6).trim().split(/\s+/).map(Number);
      for (let k = 1; k + 1 < f.length; k += 2) atoms[f[k] - 1].q = f[k + 1];
    }
    if (l.startsWith('M  END')) break;
  }
  const cidLine = lines.findIndex((l) => l.includes('<PUBCHEM_COMPOUND_CID>'));
  const cid = cidLine >= 0 ? Number(lines[cidLine + 1]) : Number(lines[0]);
  if (!cid) return null;
  return { cid, atoms, bonds };
}

function pickSynonyms(list) {
  const out = [];
  for (const s of list) {
    if (out.length >= 6) break;
    if (s.length > 40 || s.length < 2) continue;
    if (/^\d+-\d+-\d$/.test(s)) continue; // CAS numbers
    if (/^(RefChem|UNII|CHEBI|CHEMBL|DTXSID|DTXCID|NSC|SCHEMBL|AKOS|MFCD|EINECS|HMDB|BRN|CCRIS|HSDB|ZINC|KEGG|C\d{5}|D\d{5}|AC1|BDBM|Q\d+)/i.test(s)) continue;
    if (/[{}\[\]]/.test(s) || /^[A-Z0-9-]{6,}$/.test(s)) continue;
    if (!out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out;
}

// ---------- 3. assemble ----------
function hill(symbols) {
  const counts = new Map();
  for (const s of symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
  const part = (s) => s + ((counts.get(s) ?? 0) > 1 ? counts.get(s) : '');
  const keys = [...counts.keys()];
  if (counts.has('C')) {
    const rest = keys.filter((k) => k !== 'C' && k !== 'H').sort();
    return [part('C'), counts.has('H') ? part('H') : '', ...rest.map(part)].join('');
  }
  return keys.sort().map(part).join('');
}

const seen = new Set();
const molecules = [];
const missing = [];
const skipped = [];
for (const e of entries) {
  if (!e.cid) {
    missing.push(e.query);
    continue;
  }
  if (seen.has(e.cid)) continue;
  const rec = recCache[e.cid];
  if (!rec) {
    missing.push(`${e.query} (no 2D record)`);
    continue;
  }
  if (rec.atoms.length > MAX_ATOMS || rec.atoms.some((a) => !/^[A-Z][a-z]?$/.test(a.s))) {
    skipped.push(`${e.label} (${rec.atoms.length} atoms)`);
    continue;
  }
  seen.add(e.cid);
  const symbols = rec.atoms.map((a) => a.s);
  const charges = [];
  rec.atoms.forEach((a, i) => a.q && charges.push(i, a.q));
  const synonyms = rec.synonyms.filter((s) => s.toLowerCase() !== e.label.toLowerCase() && !/^RefChem/i.test(s)).slice(0, 5);
  molecules.push({
    id: e.cid,
    n: e.label,
    c: e.category,
    f: hill(symbols),
    q: rec.atoms.reduce((t, a) => t + a.q, 0),
    ...(synonyms.length ? { y: synonyms } : {}),
    a: symbols.join(' '),
    p: rec.atoms.flatMap((a) => [Math.round(a.x * 100), Math.round(a.y * 100)]),
    b: rec.bonds.flat(),
    ...(charges.length ? { z: charges } : {}),
  });
}

writeFileSync(
  OUT,
  JSON.stringify({
    source: 'PubChem PUG-REST 2D records (public domain), built by scripts/build-biomolecule-library.mjs',
    count: molecules.length,
    molecules,
  }),
);
console.log(`\n${molecules.length} molecules written to ${OUT}`);
if (missing.length) console.log(`unresolved (${missing.length}): ${missing.join('; ')}`);
if (skipped.length) console.log(`skipped as too large/unsupported (${skipped.length}): ${skipped.join('; ')}`);
