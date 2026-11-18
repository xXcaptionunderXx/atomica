/**
 * Organelle catalogue (TSK-UI-007): every non-obsolete Gene Ontology cellular-component term under
 * organelle / intracellular anatomical structure / protein-containing complex (3000+ real entries),
 * bundled in catalog.json by scripts/build-organelle-catalog.mjs. Lazily loaded.
 * Only entries linked to a blueprint (`blueprint`) are buildable and simulated.
 */
export interface CatalogTerm {
  id: string; // GO id
  name: string;
  definition: string;
  synonyms: string[];
  group: string;
  blueprint?: string;
  haystack: string;
}

interface RawCatalog {
  source: string;
  groups: string[];
  count: number;
  terms: { id: string; n: string; d: string; s?: string[]; g: number; b?: string }[];
}

export interface Catalog {
  source: string;
  groups: string[];
  terms: CatalogTerm[];
}

let cache: Promise<Catalog> | null = null;

export function decodeCatalog(raw: RawCatalog): Catalog {
  return {
    source: raw.source,
    groups: raw.groups,
    terms: raw.terms.map((t) => ({
      id: t.id,
      name: t.n,
      definition: t.d,
      synonyms: t.s ?? [],
      group: raw.groups[t.g],
      ...(t.b ? { blueprint: t.b } : {}),
      haystack: [t.n, t.id, ...(t.s ?? [])].join(' | ').toLowerCase(),
    })),
  };
}

export function loadCatalog(): Promise<Catalog> {
  cache ??= import('./catalog.json').then((mod) => decodeCatalog((mod.default ?? mod) as unknown as RawCatalog));
  return cache;
}

/** Ranked search: exact name, name prefix, word prefix, then substring anywhere (incl. GO id / synonyms). */
export function searchCatalog(terms: CatalogTerm[], query: string, group?: string): CatalogTerm[] {
  const q = query.trim().toLowerCase();
  const pool = group ? terms.filter((t) => t.group === group) : terms;
  if (!q) return pool;
  const scored: [number, CatalogTerm][] = [];
  for (const t of pool) {
    const n = t.name.toLowerCase();
    let s = -1;
    if (n === q) s = 0;
    else if (n.startsWith(q)) s = 1;
    else if (n.split(/[\s,/()-]+/).some((w) => w.startsWith(q))) s = 2;
    else if (t.haystack.includes(q)) s = 3;
    if (s >= 0) scored.push([s * 1000 + Math.min(n.length, 999) - (t.blueprint ? 500 : 0), t]);
  }
  return scored.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}
