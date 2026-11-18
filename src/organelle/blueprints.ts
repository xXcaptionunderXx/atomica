/**
 * Buildable organelle blueprints for the organelle layer (TSK-UI-007).
 *
 * Every organelle, protein and reaction here is real:
 *  - organelles are Gene Ontology cellular-component terms (GO id on each blueprint);
 *  - protein components cite an experimentally determined structure (RCSB PDB) or, where no
 *    full structure exists, the UniProt entry — every id was checked against the RCSB / UniProt APIs;
 *  - reactions are the textbook net reactions catalysed by those proteins, written with species
 *    from the biomolecule library (neutral PubChem forms, so each equation is element-balanced —
 *    tests/organelle/organelle.test.ts checks this against the library formulas).
 *
 * EXPLICIT APPROXIMATIONS (shown in the app):
 *  - Membranes are coarse-grained: each "unit" is one pasted lipid molecule standing in for a
 *    membrane patch (a real mitochondrion has ~10^7-10^8 lipids). Composition rules use real
 *    mole fractions (e.g. cardiolipin is ~15-20% of inner-mitochondrial-membrane phospholipid).
 *  - Proteins cannot be assembled atom by atom in a 2D sandbox; they are added as referenced parts.
 *  - Reactions fire as discrete turnovers per tick when their machinery is present, not as kinetics.
 */
import type { MoleculeRole } from './classify';

export type Shape =
  | 'mitochondrion'
  | 'chloroplast'
  | 'ribosome'
  | 'nucleus'
  | 'er'
  | 'golgi'
  | 'lysosome'
  | 'peroxisome'
  | 'lipid-droplet'
  | 'carboxysome'
  | 'vesicle';

export interface ProteinComponent {
  id: string;
  name: string;
  /** Structure / sequence reference that was verified to exist. */
  ref: { db: 'PDB' | 'UniProt'; id: string };
  /** What the referenced entry actually is (organism / form). */
  source: string;
  role: string;
}

export interface MembraneSpec {
  id: string;
  name: string;
  kind: 'bilayer' | 'monolayer';
  /** Coarse-grained lipid units needed to close the membrane. */
  units: number;
  /** Structural roles this membrane accepts (see classify.ts). */
  accepts: MoleculeRole[];
  /** Minimum counts of particular species (real composition requirements). */
  requires?: { species: string; min: number; why: string }[];
}

export interface SlotSpec {
  id: string;
  name: string;
  /** Accepted library species (exact names) and/or a structural role. */
  species?: string[];
  role?: MoleculeRole;
  count: number;
  why: string;
}

export interface PartSpec {
  component: string;
  count: number;
  /** Membrane id the protein sits in, or 'lumen' for the interior. */
  where: string;
}

/** `lumen:` prefix = the organelle's interior store instead of the surroundings. */
export type Stoich = [species: string, n: number];

export interface Reaction {
  id: string;
  name: string;
  kind: 'stoich' | 'translation' | 'transcription';
  /** Protein components that must all be present. */
  enzymes: string[];
  slots?: string[];
  /** Membranes that must be closed (compartment needed for the gradient / store). */
  membranes?: string[];
  light?: boolean;
  /** Only runs at or below this lumen pH (acid hydrolases). */
  maxPh?: number;
  reactants: Stoich[];
  products: Stoich[];
  /** Turnovers attempted per tick. */
  rate: number;
  /** Lumen pH change per turnover (proton pumping). */
  phShift?: number;
  note: string;
}

export interface Blueprint {
  id: string;
  name: string;
  go: string;
  shape: Shape;
  summary: string;
  membranes: MembraneSpec[];
  parts: PartSpec[];
  slots: SlotSpec[];
  reactions: Reaction[];
  /** "Stock surroundings" amounts so the function can be demonstrated. */
  feed: Record<string, number>;
  /** Lumen pH model (lysosome); omitted = not tracked. */
  ph?: { start: number; min: number; leak: number };
}

const BILAYER: MoleculeRole[] = ['bilayer-lipid', 'sterol'];

// ---------------------------------------------------------------------------
// Protein components (ids verified against data.rcsb.org / rest.uniprot.org)
// ---------------------------------------------------------------------------
const C = (id: string, name: string, db: 'PDB' | 'UniProt', ref: string, source: string, role: string): ProteinComponent => ({
  id,
  name,
  ref: { db, id: ref },
  source,
  role,
});

export const COMPONENTS: Record<string, ProteinComponent> = Object.fromEntries(
  [
    // Mitochondrion
    C('mpc', 'Mitochondrial pyruvate carrier (MPC1)', 'UniProt', 'Q9Y5U8', 'Human MPC1', 'Imports pyruvate across the inner membrane'),
    C('pdh', 'Pyruvate dehydrogenase complex (E2 core)', 'PDB', '1B5S', 'B. stearothermophilus E2 catalytic domain', 'Pyruvate + CoA + NAD+ → acetyl-CoA + CO2 + NADH'),
    C('citrate-synthase', 'Citrate synthase', 'PDB', '1CTS', 'Pig heart citrate synthase', 'First step of the citric acid cycle'),
    C('complex-i', 'Complex I (NADH:ubiquinone oxidoreductase)', 'PDB', '5XTD', 'Human respiratory complex I', 'NADH → ubiquinone, pumps 4 H+'),
    C('complex-ii', 'Complex II (succinate dehydrogenase)', 'PDB', '1ZOY', 'Porcine heart complex II', 'Succinate → fumarate, reduces ubiquinone'),
    C('complex-iii', 'Complex III (cytochrome bc1)', 'PDB', '1BGY', 'Bovine heart bc1 complex', 'Ubiquinol → cytochrome c (Q cycle), pumps H+'),
    C('cytochrome-c', 'Cytochrome c', 'PDB', '1HRC', 'Horse heart cytochrome c', 'Carries electrons from complex III to IV'),
    C('complex-iv', 'Complex IV (cytochrome c oxidase)', 'PDB', '1OCC', 'Bovine heart cytochrome c oxidase', 'Reduces O2 to water, pumps H+'),
    C('atp-synthase', 'ATP synthase (F1Fo)', 'PDB', '5ARA', 'Bovine mitochondrial ATP synthase', 'Proton flow drives ADP + Pi → ATP'),
    C('ant', 'ADP/ATP carrier (ANT)', 'PDB', '1OKC', 'Bovine ADP/ATP carrier', 'Exchanges matrix ATP for cytosolic ADP'),
    C('vdac', 'VDAC1 porin', 'PDB', '3EMN', 'Mouse VDAC1', 'Outer-membrane channel for metabolites'),
    C('tom', 'TOM complex', 'PDB', '6UCU', 'Yeast TOM core complex', 'Imports nuclear-encoded proteins'),
    // Chloroplast
    C('psii', 'Photosystem II', 'PDB', '3WU2', 'T. vulcanus photosystem II', 'Light-driven water splitting: 2 H2O → O2 + 4 H+ + 4 e-'),
    C('b6f', 'Cytochrome b6f', 'PDB', '1VF5', 'M. laminosus cytochrome b6f', 'Plastoquinol → plastocyanin, pumps H+'),
    C('plastocyanin', 'Plastocyanin', 'PDB', '1PLC', 'Poplar plastocyanin', 'Carries electrons from b6f to PSI'),
    C('psi', 'Photosystem I', 'PDB', '1JB0', 'S. elongatus photosystem I', 'Light-driven reduction of ferredoxin'),
    C('fnr', 'Ferredoxin-NADP+ reductase', 'PDB', '1FNB', 'Spinach FNR', 'Ferredoxin → NADPH'),
    C('lhcii', 'Light-harvesting complex II', 'PDB', '2BHW', 'Pea LHCII', 'Collects light for PSII'),
    C('cf-atp-synthase', 'Chloroplast ATP synthase (CF1Fo)', 'PDB', '6FKF', 'Spinach chloroplast ATP synthase', 'Thylakoid proton flow → ATP'),
    C('rubisco', 'RuBisCO', 'PDB', '8RUC', 'Activated spinach RuBisCO', 'Fixes CO2 in the Calvin cycle'),
    // Ribosome / translation
    C('ribosome-80s', '80S ribosome', 'PDB', '4V6X', 'Human 80S ribosome', 'Decodes mRNA and forms peptide bonds'),
    C('trna', 'Transfer RNA', 'PDB', '1EHZ', 'Yeast tRNA-Phe', 'Delivers amino acids matched to codons'),
    C('eef1a', 'Elongation factor eEF1A', 'PDB', '1F60', 'Yeast eEF1A:eEF1Bα', 'Brings aminoacyl-tRNA to the A site (GTP)'),
    C('eef2', 'Elongation factor eEF2', 'PDB', '1N0U', 'Yeast eEF2', 'Translocates the ribosome one codon (GTP)'),
    // Nucleus
    C('npc', 'Nuclear pore complex', 'PDB', '5A9Q', 'Human NPC (cryo-EM)', 'Gates traffic between nucleus and cytoplasm'),
    C('nucleosome', 'Nucleosome (chromatin)', 'PDB', '1KX5', 'Nucleosome core particle NCP147 (Xenopus histones, human α-satellite DNA)', 'Packages DNA around histones'),
    C('rnap2', 'RNA polymerase II', 'PDB', '1I50', 'Yeast RNA polymerase II', 'Transcribes DNA into mRNA'),
    // ER
    C('sec61', 'Sec61 translocon', 'PDB', '3J7Q', 'Mammalian ribosome–Sec61 complex', 'Threads secretory proteins into the ER'),
    C('bip', 'BiP (HSPA5) chaperone', 'PDB', '5E84', 'Human BiP', 'Folds proteins in the ER lumen'),
    C('serca', 'SERCA Ca2+ pump', 'PDB', '1SU4', 'Rabbit SERCA1a', 'Pumps 2 Ca2+ into the ER per ATP'),
    // Golgi
    C('sgms1', 'Sphingomyelin synthase 1', 'UniProt', 'Q86VZ5', 'Human SGMS1', 'Ceramide + PC → sphingomyelin + DAG'),
    C('gm130', 'GM130 (GOLGA2) golgin', 'UniProt', 'Q08379', 'Human GOLGA2', 'Tethers vesicles to cis-Golgi cisternae'),
    // Lysosome
    C('v-atpase', 'V-ATPase proton pump', 'PDB', '6WM2', 'Human V-ATPase', 'ATP hydrolysis pumps H+ into the lumen'),
    C('lamp1', 'LAMP1', 'UniProt', 'P11279', 'Human LAMP1', 'Glycoprotein that protects the lysosomal membrane'),
    C('cathepsin-b', 'Cathepsin B', 'PDB', '1HUC', 'Human cathepsin B', 'Acid protease'),
    C('gaa', 'Acid α-glucosidase (GAA)', 'PDB', '5NN3', 'Human GAA', 'Hydrolyses glycogen / maltose to glucose'),
    C('lal', 'Lysosomal acid lipase (LIPA)', 'PDB', '6V7N', 'Human LAL', 'Hydrolyses triglycerides and cholesteryl esters'),
    // Peroxisome
    C('catalase', 'Catalase', 'PDB', '1DGB', 'Human erythrocyte catalase', '2 H2O2 → 2 H2O + O2'),
    C('daao', 'D-amino-acid oxidase', 'PDB', '2DU8', 'Human DAAO', 'Oxidises D-amino acids, producing H2O2'),
    C('pex5', 'PEX5 import receptor', 'PDB', '1FCH', 'Human PEX5 TPR domain + PTS1', 'Imports matrix enzymes (PTS1)'),
    // Lipid droplet
    C('atgl', 'Adipose triglyceride lipase (PNPLA2)', 'UniProt', 'Q96AD5', 'Human ATGL', 'First step of triglyceride breakdown'),
    C('plin1', 'Perilipin-1', 'UniProt', 'O60240', 'Human PLIN1', 'Coats the droplet and gates lipolysis'),
    // Carboxysome (α-carboxysome of Halothiobacillus neapolitanus)
    C('csos1a', 'CsoS1A shell hexamer', 'PDB', '2EWH', 'H. neapolitanus CsoS1A', 'Protein shell tile'),
    C('csosca', 'CsoSCA carbonic anhydrase', 'PDB', '2FGY', 'H. neapolitanus CsoSCA', 'HCO3- → CO2 inside the shell'),
    C('cso-rubisco', 'Form IA RuBisCO', 'PDB', '1SVD', 'H. neapolitanus RuBisCO', 'Fixes the concentrated CO2'),
  ].map((c) => [c.id, c]),
);

// ---------------------------------------------------------------------------
// Blueprints
// ---------------------------------------------------------------------------
const PI = 'Phosphoric acid'; // inorganic phosphate, neutral form so equations balance by element

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'mitochondrion',
    name: 'Mitochondrion',
    go: 'GO:0005739',
    shape: 'mitochondrion',
    summary:
      'Double-membrane organelle that oxidises pyruvate and fatty acids. Electron transport in the cardiolipin-rich inner membrane pumps protons; ATP synthase uses that gradient to make ATP.',
    membranes: [
      { id: 'outer', name: 'Outer membrane', kind: 'bilayer', units: 28, accepts: BILAYER },
      {
        id: 'inner',
        name: 'Inner membrane (cristae)',
        kind: 'bilayer',
        units: 40,
        accepts: ['bilayer-lipid'],
        requires: [{ species: 'Cardiolipin (tetralinoleoyl)', min: 6, why: 'Cardiolipin (~15-20% of inner-membrane phospholipid) holds complexes III/IV and ATP-synthase dimers together' }],
      },
    ],
    parts: [
      { component: 'vdac', count: 2, where: 'outer' },
      { component: 'tom', count: 1, where: 'outer' },
      { component: 'mpc', count: 1, where: 'inner' },
      { component: 'complex-i', count: 1, where: 'inner' },
      { component: 'complex-ii', count: 1, where: 'inner' },
      { component: 'complex-iii', count: 1, where: 'inner' },
      { component: 'complex-iv', count: 1, where: 'inner' },
      { component: 'atp-synthase', count: 2, where: 'inner' },
      { component: 'ant', count: 1, where: 'inner' },
      { component: 'cytochrome-c', count: 2, where: 'lumen' },
      { component: 'pdh', count: 1, where: 'lumen' },
      { component: 'citrate-synthase', count: 1, where: 'lumen' },
    ],
    slots: [{ id: 'coq', name: 'Ubiquinone pool', species: ['Coenzyme Q10', 'Ubiquinol'], count: 4, why: 'Mobile electron carrier from complexes I/II to III' }],
    reactions: [
      {
        id: 'respiration',
        name: 'Aerobic respiration of pyruvate',
        kind: 'stoich',
        enzymes: ['mpc', 'pdh', 'citrate-synthase', 'complex-i', 'complex-ii', 'complex-iii', 'cytochrome-c', 'complex-iv', 'atp-synthase', 'ant', 'vdac'],
        slots: ['coq'],
        membranes: ['outer', 'inner'],
        reactants: [['Pyruvic acid', 2], ['Oxygen', 5], ['Adenosine diphosphate', 25], [PI, 25]],
        products: [['Carbon dioxide', 6], ['Water', 29], ['Adenosine triphosphate', 25]],
        rate: 1,
        note: 'Net PDH + citric acid cycle + oxidative phosphorylation: ~12.5 ATP per pyruvate (P/O 2.5 for NADH, 1.5 for FADH2). Needs both membranes closed: the inner membrane holds the proton gradient.',
      },
      {
        id: 'beta-oxidation',
        name: 'β-oxidation of palmitate',
        kind: 'stoich',
        enzymes: ['complex-i', 'complex-ii', 'complex-iii', 'cytochrome-c', 'complex-iv', 'atp-synthase', 'ant', 'vdac'],
        slots: ['coq'],
        membranes: ['outer', 'inner'],
        reactants: [['Palmitic acid', 1], ['Oxygen', 23], ['Adenosine diphosphate', 106], [PI, 106]],
        products: [['Carbon dioxide', 16], ['Water', 122], ['Adenosine triphosphate', 106]],
        rate: 1,
        note: 'Net yield 106 ATP per palmitate (108 minus 2 ATP equivalents for activation to palmitoyl-CoA).',
      },
    ],
    feed: { 'Pyruvic acid': 20, Oxygen: 60, 'Adenosine diphosphate': 300, [PI]: 300, 'Palmitic acid': 2 },
  },
  {
    id: 'chloroplast',
    name: 'Chloroplast',
    go: 'GO:0009507',
    shape: 'chloroplast',
    summary:
      'Plastid that captures light. Pigments in the galactolipid thylakoid membrane drive water splitting and electron transport; the stroma fixes CO2 into sugar (Calvin cycle).',
    membranes: [
      { id: 'outer', name: 'Outer envelope', kind: 'bilayer', units: 28, accepts: BILAYER },
      { id: 'inner', name: 'Inner envelope', kind: 'bilayer', units: 26, accepts: BILAYER },
      {
        id: 'thylakoid',
        name: 'Thylakoid membrane (grana)',
        kind: 'bilayer',
        units: 36,
        accepts: ['bilayer-lipid'],
        requires: [
          { species: 'Monogalactosyldiacylglycerol (MGDG, thylakoid lipid)', min: 14, why: 'MGDG is ~50% of thylakoid lipid' },
          { species: 'Digalactosyldiacylglycerol (DGDG, thylakoid lipid)', min: 7, why: 'DGDG is ~25% of thylakoid lipid' },
        ],
      },
    ],
    parts: [
      { component: 'lhcii', count: 2, where: 'thylakoid' },
      { component: 'psii', count: 1, where: 'thylakoid' },
      { component: 'b6f', count: 1, where: 'thylakoid' },
      { component: 'psi', count: 1, where: 'thylakoid' },
      { component: 'cf-atp-synthase', count: 1, where: 'thylakoid' },
      { component: 'plastocyanin', count: 1, where: 'lumen' },
      { component: 'fnr', count: 1, where: 'lumen' },
      { component: 'rubisco', count: 3, where: 'lumen' },
    ],
    slots: [
      { id: 'chla', name: 'Chlorophyll a', species: ['Chlorophyll a'], count: 6, why: 'Reaction-centre and antenna pigment' },
      { id: 'chlb', name: 'Chlorophyll b', species: ['Chlorophyll b'], count: 2, why: 'LHCII antenna pigment' },
      { id: 'car', name: 'Carotenoids', species: ['Beta-carotene (provitamin A)'], count: 2, why: 'Photoprotection and light harvesting' },
      { id: 'pq', name: 'Plastoquinone pool', species: ['Plastoquinone'], count: 2, why: 'Carries electrons PSII → b6f' },
    ],
    reactions: [
      {
        id: 'photosynthesis',
        name: 'Oxygenic photosynthesis',
        kind: 'stoich',
        enzymes: ['lhcii', 'psii', 'b6f', 'plastocyanin', 'psi', 'fnr', 'cf-atp-synthase', 'rubisco'],
        slots: ['chla', 'chlb', 'car', 'pq'],
        membranes: ['thylakoid', 'inner', 'outer'],
        light: true,
        reactants: [['Carbon dioxide', 6], ['Water', 6]],
        products: [['D-Glucose', 1], ['Oxygen', 6]],
        rate: 1,
        note: 'Net equation (glucose equivalent). Internally the light reactions make the 18 ATP + 12 NADPH the Calvin cycle spends per glucose; O2 comes from water split by PSII.',
      },
    ],
    feed: { 'Carbon dioxide': 60, Water: 60 },
  },
  {
    id: 'ribosome',
    name: 'Ribosome',
    go: 'GO:0005840',
    shape: 'ribosome',
    summary: 'Ribonucleoprotein machine (no membrane) that translates mRNA codons into a polypeptide using tRNAs and GTP-driven elongation factors.',
    membranes: [],
    parts: [
      { component: 'ribosome-80s', count: 1, where: 'lumen' },
      { component: 'trna', count: 3, where: 'lumen' },
      { component: 'eef1a', count: 1, where: 'lumen' },
      { component: 'eef2', count: 1, where: 'lumen' },
    ],
    slots: [],
    reactions: [
      {
        id: 'translation',
        name: 'Translation (elongation)',
        kind: 'translation',
        enzymes: ['ribosome-80s', 'trna', 'eef1a', 'eef2'],
        reactants: [['Adenosine triphosphate', 1], ['Guanosine triphosphate', 2], ['Water', 2]],
        products: [['Adenosine monophosphate', 1], ['Pyrophosphate', 1], ['Guanosine diphosphate', 2], [PI, 2]],
        rate: 1,
        note: 'Per residue: tRNA charging (ATP → AMP + PPi), eEF1A delivery and eEF2 translocation (2 GTP), and the amino acid itself. Standard genetic code from the first AUG to a stop codon; initiation/termination factors are not modelled.',
      },
    ],
    feed: {
      'Adenosine triphosphate': 40,
      'Guanosine triphosphate': 80,
      Water: 80,
      'L-Methionine': 4,
      'L-Alanine': 4,
      'L-Serine': 4,
      Glycine: 4,
      'L-Leucine': 4,
      'L-Lysine': 4,
    },
  },
  {
    id: 'nucleus',
    name: 'Nucleus',
    go: 'GO:0005634',
    shape: 'nucleus',
    summary: 'Holds the chromatin. RNA polymerase II transcribes genes into mRNA, which leaves through nuclear pores to be translated by ribosomes.',
    membranes: [
      { id: 'outer', name: 'Outer nuclear membrane', kind: 'bilayer', units: 34, accepts: BILAYER },
      { id: 'inner', name: 'Inner nuclear membrane', kind: 'bilayer', units: 30, accepts: BILAYER },
    ],
    parts: [
      { component: 'npc', count: 4, where: 'outer' },
      { component: 'nucleosome', count: 4, where: 'lumen' },
      { component: 'rnap2', count: 1, where: 'lumen' },
    ],
    slots: [],
    reactions: [
      {
        id: 'transcription',
        name: 'Transcription',
        kind: 'transcription',
        enzymes: ['rnap2', 'nucleosome', 'npc'],
        membranes: ['outer', 'inner'],
        reactants: [],
        products: [['Pyrophosphate', 1]],
        rate: 2,
        note: 'RNA polymerase II adds one NTP per template base (A/G/C/U from ATP/GTP/CTP/UTP), releasing pyrophosphate. Enter the coding strand; the mRNA can be sent to a ribosome.',
      },
    ],
    feed: { 'Adenosine triphosphate': 30, 'Guanosine triphosphate': 30, 'Cytidine triphosphate': 30, 'Uridine triphosphate': 30 },
  },
  {
    id: 'er',
    name: 'Endoplasmic reticulum',
    go: 'GO:0005783',
    shape: 'er',
    summary: 'Network of membrane sheets and tubules. Imports and folds secretory proteins (Sec61, BiP) and stores calcium pumped in by SERCA.',
    membranes: [{ id: 'er', name: 'ER membrane', kind: 'bilayer', units: 40, accepts: BILAYER }],
    parts: [
      { component: 'sec61', count: 2, where: 'er' },
      { component: 'serca', count: 2, where: 'er' },
      { component: 'bip', count: 2, where: 'lumen' },
    ],
    slots: [],
    reactions: [
      {
        id: 'serca',
        name: 'Ca2+ uptake by SERCA',
        kind: 'stoich',
        enzymes: ['serca'],
        membranes: ['er'],
        reactants: [['Calcium ion', 2], ['Adenosine triphosphate', 1], ['Water', 1]],
        products: [['lumen:Calcium ion', 2], ['Adenosine diphosphate', 1], [PI, 1]],
        rate: 2,
        note: 'SERCA moves 2 Ca2+ from the cytosol into the ER lumen per ATP hydrolysed (counter-transporting H+, not modelled).',
      },
    ],
    feed: { 'Calcium ion': 40, 'Adenosine triphosphate': 30, Water: 30 },
  },
  {
    id: 'golgi',
    name: 'Golgi apparatus',
    go: 'GO:0005794',
    shape: 'golgi',
    summary: 'Stack of flattened cisternae that modifies and sorts cargo. In the trans-Golgi, sphingomyelin synthase makes sphingomyelin from ceramide.',
    membranes: [{ id: 'golgi', name: 'Cisternal membranes', kind: 'bilayer', units: 36, accepts: BILAYER }],
    parts: [
      { component: 'gm130', count: 2, where: 'golgi' },
      { component: 'sgms1', count: 2, where: 'golgi' },
    ],
    slots: [],
    reactions: [
      {
        id: 'sgms',
        name: 'Sphingomyelin synthesis',
        kind: 'stoich',
        enzymes: ['sgms1'],
        membranes: ['golgi'],
        reactants: [['Ceramide (C16)', 1], ['POPC (palmitoyl-oleoyl phosphatidylcholine)', 1]],
        products: [['Sphingomyelin (C16)', 1], ['Diacylglycerol', 1]],
        rate: 1,
        note: 'SGMS1 transfers phosphocholine from phosphatidylcholine to ceramide; the leftover is 1-palmitoyl-2-oleoyl-glycerol (diacylglycerol).',
      },
    ],
    feed: { 'Ceramide (C16)': 8, 'POPC (palmitoyl-oleoyl phosphatidylcholine)': 8 },
  },
  {
    id: 'lysosome',
    name: 'Lysosome',
    go: 'GO:0005764',
    shape: 'lysosome',
    summary: 'Acidic digestive compartment. The V-ATPase pumps protons in (pH ≈ 4.5-5); acid hydrolases only work once the lumen is acidic.',
    membranes: [{ id: 'membrane', name: 'Lysosomal membrane', kind: 'bilayer', units: 30, accepts: BILAYER }],
    parts: [
      { component: 'v-atpase', count: 1, where: 'membrane' },
      { component: 'lamp1', count: 2, where: 'membrane' },
      { component: 'cathepsin-b', count: 1, where: 'lumen' },
      { component: 'gaa', count: 1, where: 'lumen' },
      { component: 'lal', count: 1, where: 'lumen' },
    ],
    slots: [],
    reactions: [
      {
        id: 'v-atpase',
        name: 'Proton pumping (V-ATPase)',
        kind: 'stoich',
        enzymes: ['v-atpase'],
        membranes: ['membrane'],
        reactants: [['Adenosine triphosphate', 1], ['Water', 1]],
        products: [['Adenosine diphosphate', 1], [PI, 1]],
        rate: 1,
        phShift: -0.25,
        note: 'ATP hydrolysis drives H+ into the lumen; the closed membrane holds the gradient against a slow leak.',
      },
      {
        id: 'gaa',
        name: 'Maltose hydrolysis (GAA)',
        kind: 'stoich',
        enzymes: ['gaa'],
        membranes: ['membrane'],
        maxPh: 5.5,
        reactants: [['Maltose', 1], ['Water', 1]],
        products: [['D-Glucose', 2]],
        rate: 1,
        note: 'Acid α-glucosidase (optimum pH ~4.5) cleaves α-1,4 glucose links.',
      },
      {
        id: 'lal',
        name: 'Triglyceride hydrolysis (LAL)',
        kind: 'stoich',
        enzymes: ['lal'],
        membranes: ['membrane'],
        maxPh: 5.5,
        reactants: [['Triolein', 1], ['Water', 3]],
        products: [['Glycerol', 1], ['Oleic acid', 3]],
        rate: 1,
        note: 'Lysosomal acid lipase releases free fatty acids (net of the three ester hydrolyses).',
      },
    ],
    feed: { 'Adenosine triphosphate': 40, Water: 60, Maltose: 10, Triolein: 4 },
    ph: { start: 7.2, min: 4.5, leak: 0.03 },
  },
  {
    id: 'peroxisome',
    name: 'Peroxisome',
    go: 'GO:0005777',
    shape: 'peroxisome',
    summary: 'Single-membrane oxidative organelle. Oxidases such as DAAO make hydrogen peroxide; catalase destroys it.',
    membranes: [{ id: 'membrane', name: 'Peroxisomal membrane', kind: 'bilayer', units: 24, accepts: BILAYER }],
    parts: [
      { component: 'pex5', count: 1, where: 'membrane' },
      { component: 'daao', count: 1, where: 'lumen' },
      { component: 'catalase', count: 2, where: 'lumen' },
    ],
    slots: [{ id: 'fad', name: 'FAD cofactor', species: ['Flavin adenine dinucleotide (FAD)'], count: 1, why: 'DAAO is a flavoenzyme' }],
    reactions: [
      {
        id: 'daao',
        name: 'D-alanine oxidation (DAAO)',
        kind: 'stoich',
        enzymes: ['daao'],
        slots: ['fad'],
        membranes: ['membrane'],
        reactants: [['D-Alanine', 1], ['Oxygen', 1], ['Water', 1]],
        products: [['Pyruvic acid', 1], ['Ammonia', 1], ['Hydrogen peroxide', 1]],
        rate: 2,
        note: 'Oxidative deamination; the imino acid hydrolyses to pyruvate and ammonia.',
      },
      {
        id: 'catalase',
        name: 'Peroxide breakdown (catalase)',
        kind: 'stoich',
        enzymes: ['catalase'],
        reactants: [['Hydrogen peroxide', 2]],
        products: [['Water', 2], ['Oxygen', 1]],
        rate: 2,
        note: 'Catalase is one of the fastest enzymes known (kcat ~10^7 s^-1).',
      },
    ],
    feed: { 'D-Alanine': 20, Oxygen: 30, Water: 30 },
  },
  {
    id: 'lipid-droplet',
    name: 'Lipid droplet',
    go: 'GO:0005811',
    shape: 'lipid-droplet',
    summary: 'Neutral-lipid store: a triglyceride core wrapped in a phospholipid MONOlayer (not a bilayer), coated by perilipins. ATGL starts lipolysis.',
    membranes: [{ id: 'monolayer', name: 'Phospholipid monolayer', kind: 'monolayer', units: 24, accepts: ['bilayer-lipid'] }],
    parts: [
      { component: 'plin1', count: 2, where: 'monolayer' },
      { component: 'atgl', count: 1, where: 'monolayer' },
    ],
    slots: [{ id: 'core', name: 'Neutral-lipid core', role: 'neutral-lipid', count: 8, why: 'Triglycerides / cholesteryl esters fill the droplet' }],
    reactions: [
      {
        id: 'atgl',
        name: 'Lipolysis (ATGL)',
        kind: 'stoich',
        enzymes: ['atgl'],
        slots: ['core'],
        membranes: ['monolayer'],
        reactants: [['Triolein', 1], ['Water', 1]],
        products: [['1,2-Dioleoylglycerol', 1], ['Oleic acid', 1]],
        rate: 1,
        note: 'ATGL removes one fatty acid (it mostly makes sn-1,3 / 2,3-DAG; the library holds the 1,2 isomer, same formula).',
      },
    ],
    feed: { Triolein: 6, Water: 20 },
  },
  {
    id: 'carboxysome',
    name: 'Carboxysome (α)',
    go: 'GO:0031470',
    shape: 'carboxysome',
    summary: 'Bacterial microcompartment with a PROTEIN shell (no lipid). Carbonic anhydrase inside turns bicarbonate into CO2 so RuBisCO can fix it efficiently.',
    membranes: [],
    parts: [
      { component: 'csos1a', count: 12, where: 'lumen' },
      { component: 'csosca', count: 1, where: 'lumen' },
      { component: 'cso-rubisco', count: 4, where: 'lumen' },
    ],
    slots: [],
    reactions: [
      {
        id: 'csosca',
        name: 'Bicarbonate dehydration (CsoSCA)',
        kind: 'stoich',
        enzymes: ['csosca', 'csos1a'],
        reactants: [['Bicarbonate ion', 1]],
        products: [['lumen:Carbon dioxide', 1], ['Hydroxide ion', 1]],
        rate: 2,
        note: 'Generates CO2 inside the shell, which slows its escape.',
      },
      {
        id: 'cso-rubisco',
        name: 'Carbon fixation (RuBisCO)',
        kind: 'stoich',
        enzymes: ['cso-rubisco', 'csos1a'],
        reactants: [['Ribulose 1,5-bisphosphate', 1], ['lumen:Carbon dioxide', 1], ['Water', 1]],
        products: [['3-Phosphoglycerate', 2]],
        rate: 2,
        note: 'RuBP + CO2 + H2O → 2 3-phosphoglycerate.',
      },
    ],
    feed: { 'Bicarbonate ion': 20, 'Ribulose 1,5-bisphosphate': 20, Water: 20 },
  },
  {
    id: 'vesicle',
    name: 'Lipid vesicle',
    go: 'GO:0031982',
    shape: 'vesicle',
    summary: 'A closed lipid bilayer — the simplest membrane compartment. Pasting any bilayer lipid with no organelle chosen starts one.',
    membranes: [{ id: 'membrane', name: 'Bilayer', kind: 'bilayer', units: 24, accepts: BILAYER }],
    parts: [],
    slots: [],
    reactions: [],
    feed: {},
  },
];

export const BLUEPRINT_BY_ID: Record<string, Blueprint> = Object.fromEntries(BLUEPRINTS.map((b) => [b.id, b]));

/** Standard genetic code (RNA codons → one-letter amino acid, '*' = stop). */
const BASES = 'UCAG';
const AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
export const GENETIC_CODE: Record<string, string> = {};
for (let i = 0; i < 64; i++) GENETIC_CODE[BASES[i >> 4] + BASES[(i >> 2) & 3] + BASES[i & 3]] = AA[i];

/** One-letter amino acid → biomolecule-library name. */
export const AMINO_ACIDS: Record<string, string> = {
  A: 'L-Alanine',
  R: 'L-Arginine',
  N: 'L-Asparagine',
  D: 'L-Aspartic acid',
  C: 'L-Cysteine',
  E: 'L-Glutamic acid',
  Q: 'L-Glutamine',
  G: 'Glycine',
  H: 'L-Histidine',
  I: 'L-Isoleucine',
  L: 'L-Leucine',
  K: 'L-Lysine',
  M: 'L-Methionine',
  F: 'L-Phenylalanine',
  P: 'L-Proline',
  S: 'L-Serine',
  T: 'L-Threonine',
  W: 'L-Tryptophan',
  Y: 'L-Tyrosine',
  V: 'L-Valine',
};

/** RNA base → NTP library name (transcription). */
export const NTPS: Record<string, string> = {
  A: 'Adenosine triphosphate',
  G: 'Guanosine triphosphate',
  C: 'Cytidine triphosphate',
  U: 'Uridine triphosphate',
};
