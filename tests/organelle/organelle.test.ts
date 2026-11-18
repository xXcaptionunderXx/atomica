import { describe, expect, it } from 'vitest';
import libraryData from '../../src/chemistry/biomolecules/library.json';
import catalogData from '../../src/organelle/catalog.json';
import { decode, toTemplate, type Biomolecule, type RawBiomolecule } from '../../src/chemistry/biomolecules/library';
import { parseFormula } from '../../src/chemistry/compoundNames';
import { AMINO_ACIDS, BLUEPRINTS, COMPONENTS, DEFAULT_ROLES, NTPS, apportion } from '../../src/organelle/blueprints';
import { classifyTemplate } from '../../src/organelle/classify';
import { decodeCatalog, searchCatalog } from '../../src/organelle/catalog';
import { identify, identifyAll, indexLibrary, type Species } from '../../src/organelle/identify';
import { OrganelleModel } from '../../src/organelle/OrganelleModel';
import { MoleculeModel } from '../../src/sandbox/MoleculeModel';

const list: Biomolecule[] = (libraryData as unknown as { molecules: RawBiomolecule[] }).molecules.map(decode);
const lib = indexLibrary(list);
const byName = (n: string) => {
  const m = lib.byName.get(n);
  if (!m) throw new Error(`missing ${n}`);
  return m;
};
const species = (n: string): Species => identify({ ...toTemplate(byName(n), 0, 0, 40), name: n }, lib);
const catalog = decodeCatalog(catalogData as never);

describe('organelle catalogue (Gene Ontology)', () => {
  it('has at least 3000 real GO cellular-component terms with ids and names', () => {
    expect(catalog.terms.length).toBeGreaterThanOrEqual(3000);
    for (const t of catalog.terms) {
      expect(t.id).toMatch(/^GO:\d{7}$/);
      expect(t.name.length).toBeGreaterThan(0);
    }
    expect(new Set(catalog.terms.map((t) => t.id)).size).toBe(catalog.terms.length);
  });

  it('contains the canonical organelles and links them to blueprints', () => {
    const find = (id: string) => catalog.terms.find((t) => t.id === id);
    expect(find('GO:0005739')?.name).toBe('mitochondrion');
    expect(find('GO:0005739')?.blueprint).toBe('mitochondrion');
    expect(find('GO:0009507')?.blueprint).toBe('chloroplast');
    expect(find('GO:0005764')?.blueprint).toBe('lysosome');
    for (const bp of BLUEPRINTS) expect(find(bp.go), bp.go).toBeTruthy();
  });

  it('search ranks the exact organelle first', () => {
    expect(searchCatalog(catalog.terms, 'mitochondrion')[0].id).toBe('GO:0005739');
    expect(searchCatalog(catalog.terms, 'lysosome')[0].id).toBe('GO:0005764');
  });
});

describe('blueprints use only real, balanced chemistry', () => {
  const elements = (name: string, n: number, into: Map<string, number>) => {
    for (const [el, c] of parseFormula(byName(name.replace(/^lumen:/, '')).formula)) into.set(el, (into.get(el) ?? 0) + c * n);
  };

  it('every species named in a blueprint exists in the molecule library', () => {
    const names = new Set<string>([...Object.values(AMINO_ACIDS), ...Object.values(NTPS)]);
    for (const bp of BLUEPRINTS) {
      for (const r of bp.reactions) for (const [sp] of [...r.reactants, ...r.products]) names.add(sp.replace(/^lumen:/, ''));
      for (const k of Object.keys(bp.feed)) names.add(k);
      for (const sl of bp.slots) for (const s of sl.species ?? []) names.add(s);
      for (const m of bp.membranes) for (const r of m.requires ?? []) names.add(r.species);
    }
    for (const n of names) expect(lib.byName.has(n), n).toBe(true);
  });

  it('every protein part references a defined component with a PDB/UniProt id', () => {
    for (const bp of BLUEPRINTS) {
      for (const p of bp.parts) {
        const c = COMPONENTS[p.component];
        expect(c, p.component).toBeTruthy();
        expect(c.ref.id).toMatch(c.ref.db === 'PDB' ? /^[0-9][A-Z0-9]{3}$/ : /^[OPQ][0-9][A-Z0-9]{3}[0-9]$/);
      }
      for (const r of bp.reactions) for (const e of r.enzymes) expect(bp.parts.some((p) => p.component === e), `${bp.id}/${e}`).toBe(true);
    }
  });

  it('every stoichiometric reaction is element-balanced against the library formulas', () => {
    for (const bp of BLUEPRINTS) {
      for (const r of bp.reactions.filter((x) => x.kind === 'stoich')) {
        const left = new Map<string, number>();
        const right = new Map<string, number>();
        for (const [sp, n] of r.reactants) elements(sp, n, left);
        for (const [sp, n] of r.products) elements(sp, n, right);
        // Charge: Ca2+ moves unchanged; HCO3- -> CO2 + OH- keeps -1.
        expect(Object.fromEntries([...right].sort()), `${bp.id}/${r.id}`).toEqual(Object.fromEntries([...left].sort()));
      }
    }
  });
});

describe('structural classification', () => {
  const role = (n: string) => classifyTemplate(toTemplate(byName(n), 0, 0, 1)).role;
  it('recognises bilayer lipids, sterols and neutral lipids from the atom graph', () => {
    expect(role('POPC (palmitoyl-oleoyl phosphatidylcholine)')).toBe('bilayer-lipid');
    expect(role('Cardiolipin (tetralinoleoyl)')).toBe('bilayer-lipid');
    expect(role('Sphingomyelin (C16)')).toBe('bilayer-lipid');
    expect(role('Monogalactosyldiacylglycerol (MGDG, thylakoid lipid)')).toBe('bilayer-lipid');
    expect(role('Cholesterol')).toBe('sterol');
    expect(role('Triolein')).toBe('neutral-lipid');
    expect(role('Cholesteryl oleate')).toBe('neutral-lipid');
    expect(role('Oleic acid')).toBe('single-chain-lipid');
    expect(role('D-Glucose')).toBe('molecule');
    expect(role('Adenosine triphosphate')).toBe('molecule');
  });

  it('identifies a lipid re-built atom by atom (no library name attached)', () => {
    const t = toTemplate(byName('POPC (palmitoyl-oleoyl phosphatidylcholine)'), 0, 0, 40);
    const sp = identify({ ...t, name: '' }, lib);
    expect(sp.name).toBe('POPC (palmitoyl-oleoyl phosphatidylcholine)');
    expect(sp.role).toBe('bilayer-lipid');
  });

  it('splits a multi-molecule copy from the atomic layer into separate species', () => {
    const atomic = new MoleculeModel();
    atomic.addMolecule({ ...toTemplate(byName('Cholesterol'), 0, 0, 40), name: 'Cholesterol' });
    atomic.addMolecule({ ...toTemplate(byName('POPC (palmitoyl-oleoyl phosphatidylcholine)'), 900, 0, 40), name: 'POPC (palmitoyl-oleoyl phosphatidylcholine)' });
    const copied = atomic.extract(atomic.getAtoms().map((a) => a.id))!;
    const keys = identifyAll(copied, lib).map((s) => s.key).sort();
    expect(keys).toEqual(['Cholesterol', 'POPC (palmitoyl-oleoyl phosphatidylcholine)']);
  });
});

describe('fully built organelles (default placement)', () => {
  it('default membrane compositions use real library lipids that the membrane accepts', () => {
    for (const bp of BLUEPRINTS) {
      for (const mem of bp.membranes) {
        const sum = mem.composition.reduce((s, [, f]) => s + f, 0);
        expect(sum, `${bp.id}/${mem.id}`).toBeCloseTo(1, 6);
        for (const [sp] of mem.composition) {
          const role = classifyTemplate(toTemplate(byName(sp), 0, 0, 1)).role;
          expect(role, `${bp.id}/${mem.id}/${sp}`).toBe(DEFAULT_ROLES[sp] ?? 'bilayer-lipid');
          expect(mem.accepts, `${bp.id}/${mem.id}/${sp}`).toContain(role);
        }
        const counts = apportion(mem.composition, mem.units);
        expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(mem.units);
        for (const r of mem.requires ?? []) expect(counts.get(r.species) ?? 0, `${bp.id}/${mem.id} ${r.species}`).toBeGreaterThanOrEqual(r.min);
      }
      for (const sl of bp.slots) for (const [sp] of sl.fill ?? []) expect(lib.byName.has(sp), sp).toBe(true);
    }
  });

  it('every organelle placed fully built is complete and all of its reactions run', () => {
    for (const bp of BLUEPRINTS) {
      const m = new OrganelleModel();
      m.setBlueprint(bp.id, 'built');
      expect(m.status().complete, bp.id).toBe(true);
      for (let i = 0; i < 30; i++) m.tick();
      for (const r of bp.reactions) expect(m.state.turnovers[r.id] ?? 0, `${bp.id}/${r.id}`).toBeGreaterThan(0);
    }
  });

  it('the mitochondrial inner membrane gets its real cardiolipin share', () => {
    const m = new OrganelleModel();
    m.setBlueprint('mitochondrion', 'built');
    const inner = m.status().membranes.find((x) => x.spec.id === 'inner')!;
    expect(inner.members.filter((k) => k === 'Cardiolipin (tetralinoleoyl)').length).toBe(7); // 18% of 40
  });

  it('"empty" placement leaves it to build, and Complete keeps what you built', () => {
    const m = new OrganelleModel();
    m.setBlueprint('lysosome', 'empty');
    expect(m.status().progress).toBe(0);
    m.addSpecies([species('DOPC (dioleoylphosphatidylcholine)')], 5);
    m.completeOrganelle();
    expect(m.status().complete).toBe(true);
    expect(m.status().membranes[0].members.filter((k) => k.startsWith('DOPC')).length).toBe(5);
    m.undo();
    expect(m.status().complete).toBe(false);
  });
});

describe('organelle model', () => {
  it('pasting bilayer lipids with no organelle starts and closes a lipid vesicle', () => {
    const m = new OrganelleModel();
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 23);
    expect(m.blueprint?.id).toBe('vesicle');
    expect(m.status().membranes[0].closed).toBe(false);
    m.addSpecies([species('Cholesterol')], 1);
    expect(m.status().membranes[0].closed).toBe(true);
    expect(m.status().complete).toBe(true);
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 3); // overflow goes to the surroundings
    expect(m.state.pools['POPC (palmitoyl-oleoyl phosphatidylcholine)']).toBe(3);
  });

  it('only accepts molecules that can physically form the membrane', () => {
    const m = new OrganelleModel();
    m.setBlueprint('lysosome');
    m.addSpecies([species('Oleic acid'), species('D-Glucose'), species('Triolein')], 2);
    expect(m.status().membranes[0].filled).toBe(0);
    expect(m.state.pools['Oleic acid']).toBe(2);
  });

  it('holds exactly one organelle: choosing another replaces it (undoable)', () => {
    const m = new OrganelleModel();
    m.setBlueprint('peroxisome');
    m.setBlueprint('golgi');
    expect(m.blueprint?.id).toBe('golgi');
    m.undo();
    expect(m.blueprint?.id).toBe('peroxisome');
    m.redo();
    expect(m.blueprint?.id).toBe('golgi');
  });

  it('the inner mitochondrial membrane needs cardiolipin to close', () => {
    const m = new OrganelleModel();
    m.setBlueprint('mitochondrion');
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 28 + 40);
    const inner = () => m.status().membranes.find((x) => x.spec.id === 'inner')!;
    expect(inner().filled).toBe(40);
    expect(inner().closed).toBe(false);
    m.addSpecies([species('Cardiolipin (tetralinoleoyl)')], 6); // swaps out filler PC
    expect(inner().closed).toBe(true);
  });

  it('a complete mitochondrion respires pyruvate to 12.5 ATP each, and stops if a membrane opens', () => {
    const m = new OrganelleModel();
    m.setBlueprint('mitochondrion');
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 62);
    m.addSpecies([species('Cardiolipin (tetralinoleoyl)')], 6);
    m.addSpecies([species('Coenzyme Q10')], 4);
    m.addAllProteins();
    expect(m.status().complete).toBe(true);
    m.adjustPool('Pyruvic acid', 2);
    m.adjustPool('Oxygen', 5);
    m.adjustPool('Adenosine diphosphate', 25);
    m.adjustPool('Phosphoric acid', 25);
    m.tick();
    expect(m.state.pools['Adenosine triphosphate']).toBe(25);
    expect(m.state.pools['Carbon dioxide']).toBe(6);
    m.removeMember('membrane', 'inner', 'Cardiolipin (tetralinoleoyl)');
    m.adjustPool('Pyruvic acid', 2);
    m.adjustPool('Oxygen', 5);
    m.adjustPool('Adenosine diphosphate', 25);
    m.adjustPool('Phosphoric acid', 25);
    expect(m.status().reactions[0].blockers).toContain('Inner membrane (cristae) must be closed');
    m.tick();
    expect(m.state.pools['Adenosine triphosphate']).toBe(25); // no closed inner membrane, no ATP
  });

  it('a complete peroxisome oxidises D-alanine and catalase removes the peroxide', () => {
    const m = new OrganelleModel();
    m.setBlueprint('peroxisome');
    m.addSpecies([species('DOPC (dioleoylphosphatidylcholine)')], 24);
    m.addSpecies([species('Flavin adenine dinucleotide (FAD)')], 1);
    expect(m.status().reactions.find((r) => r.reaction.id === 'daao')!.ready).toBe(false); // no enzymes yet
    m.addAllProteins();
    m.stockSurroundings();
    for (let i = 0; i < 5; i++) m.tick();
    expect(m.state.pools['Pyruvic acid']).toBe(10);
    expect(m.state.pools['Ammonia']).toBe(10);
    expect(m.state.pools['Hydrogen peroxide'] ?? 0).toBe(0); // 2 made, 2 destroyed per tick
  });

  it('a lysosome only digests once the V-ATPase has acidified a closed lumen', () => {
    const m = new OrganelleModel();
    m.setBlueprint('lysosome');
    m.addAllProteins();
    m.stockSurroundings();
    m.tick();
    expect(m.state.ph).toBe(7.2); // open membrane cannot hold a gradient
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 30);
    let ticks = 0;
    while ((m.state.ph ?? 7) > 5.5 && ticks++ < 40) m.tick();
    expect(m.state.ph!).toBeLessThanOrEqual(5.5);
    m.tick();
    expect(m.state.pools['D-Glucose']).toBeGreaterThan(0);
  });

  it('the ribosome translates an mRNA with the standard genetic code', () => {
    const m = new OrganelleModel();
    m.setBlueprint('ribosome');
    m.addAllProteins();
    m.stockSurroundings();
    m.setSequence('mrna', 'GGAUGGCUUCAGGCUAAGG'); // Met-Ala-Ser-Gly-stop
    for (let i = 0; i < 6; i++) m.tick();
    expect(m.state.peptide).toBe('MASG');
    expect(m.state.outputs).toContain('Polypeptide MASG');
    expect(m.state.pools['Guanosine diphosphate']).toBe(8);
  });

  it('the nucleus transcribes DNA into mRNA that the ribosome can use', () => {
    const m = new OrganelleModel();
    m.setBlueprint('nucleus');
    m.addAllProteins();
    m.stockSurroundings();
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 64);
    m.setSequence('dna', 'ATGAAATAG');
    for (let i = 0; i < 6; i++) m.tick();
    expect(m.state.transcript).toBe('AUGAAAUAG');
    expect(m.state.pools['Pyrophosphate']).toBe(9);
    expect(m.useTranscriptAsMrna()).toBe(true);
    expect(m.state.mrna).toBe('AUGAAAUAG');
  });

  it('a chloroplast only photosynthesises with its pigments, galactolipid thylakoids and light', () => {
    const m = new OrganelleModel();
    m.setBlueprint('chloroplast');
    m.addAllProteins();
    m.stockSurroundings();
    m.addSpecies([species('POPC (palmitoyl-oleoyl phosphatidylcholine)')], 54);
    m.addSpecies([species('Monogalactosyldiacylglycerol (MGDG, thylakoid lipid)')], 20);
    m.addSpecies([species('Digalactosyldiacylglycerol (DGDG, thylakoid lipid)')], 16);
    const ps = () => m.status().reactions[0];
    expect(ps().blockers.some((b) => b.includes('Chlorophyll a'))).toBe(true);
    m.addSpecies([species('Chlorophyll a')], 6);
    m.addSpecies([species('Chlorophyll b')], 2);
    m.addSpecies([species('Beta-carotene (provitamin A)')], 2);
    m.addSpecies([species('Plastoquinone')], 2);
    expect(ps().ready).toBe(true);
    m.setLight(false);
    m.tick();
    expect(m.state.pools['D-Glucose'] ?? 0).toBe(0);
    m.setLight(true);
    m.tick();
    expect(m.state.pools['D-Glucose']).toBe(1);
    expect(m.state.pools['Oxygen']).toBe(6);
  });
});
