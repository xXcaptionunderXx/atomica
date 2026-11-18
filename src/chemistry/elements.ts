/**
 * ATOMICA Periodic Table Data — all 118 elements.
 * Task TSK-UI-001.
 *
 * Atomic weights: IUPAC conventional / abridged standard atomic weights (4–5 significant figures).
 * Elements with no stable isotopes have no standard atomic weight; for those `mass` is the mass
 * number of a long-lived isotope and `massIsIsotope` is true (shown in brackets in the UI).
 *
 * APPROXIMATION (Section 20, explicitly labelled): `valences` lists common valences / oxidation
 * states used ONLY as a bonding-capacity rule in the 2D sandbox. Real bonding also involves
 * formal charge, dative/coordinate bonds, ionic and metallic character, and hypervalency that
 * this rule does not model. An empty list means no established bonding chemistry.
 */

export type ElementCategory =
  | 'alkali_metal'
  | 'alkaline_earth'
  | 'transition_metal'
  | 'post_transition_metal'
  | 'metalloid'
  | 'reactive_nonmetal'
  | 'noble_gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';

export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  mass: number;
  massIsIsotope: boolean;
  category: ElementCategory;
  /** IUPAC group 1–18; null for f-block (lanthanides/actinides other than group-3 placement). */
  group: number | null;
  period: number;
  valences: number[];
  /** Grid position for the standard 18-column layout (f-block shown in rows 9–10). */
  gridColumn: number;
  gridRow: number;
}

const CAT: Record<string, ElementCategory> = {
  am: 'alkali_metal',
  ae: 'alkaline_earth',
  tm: 'transition_metal',
  pt: 'post_transition_metal',
  md: 'metalloid',
  nm: 'reactive_nonmetal',
  ng: 'noble_gas',
  ln: 'lanthanide',
  ac: 'actinide',
  un: 'unknown',
};

// [Z, symbol, name, mass, massIsIsotope(1/0), category, group(0 = f-block), period, valences]
type Row = [number, string, string, number, 0 | 1, string, number, number, number[]];

const RAW: Row[] = [
  [1, 'H', 'Hydrogen', 1.008, 0, 'nm', 1, 1, [1]],
  [2, 'He', 'Helium', 4.0026, 0, 'ng', 18, 1, []],
  [3, 'Li', 'Lithium', 6.94, 0, 'am', 1, 2, [1]],
  [4, 'Be', 'Beryllium', 9.0122, 0, 'ae', 2, 2, [2]],
  [5, 'B', 'Boron', 10.81, 0, 'md', 13, 2, [3]],
  [6, 'C', 'Carbon', 12.011, 0, 'nm', 14, 2, [4]],
  [7, 'N', 'Nitrogen', 14.007, 0, 'nm', 15, 2, [3]],
  [8, 'O', 'Oxygen', 15.999, 0, 'nm', 16, 2, [2]],
  [9, 'F', 'Fluorine', 18.998, 0, 'nm', 17, 2, [1]],
  [10, 'Ne', 'Neon', 20.18, 0, 'ng', 18, 2, []],
  [11, 'Na', 'Sodium', 22.99, 0, 'am', 1, 3, [1]],
  [12, 'Mg', 'Magnesium', 24.305, 0, 'ae', 2, 3, [2]],
  [13, 'Al', 'Aluminium', 26.982, 0, 'pt', 13, 3, [3]],
  [14, 'Si', 'Silicon', 28.085, 0, 'md', 14, 3, [4]],
  [15, 'P', 'Phosphorus', 30.974, 0, 'nm', 15, 3, [3, 5]],
  [16, 'S', 'Sulfur', 32.06, 0, 'nm', 16, 3, [2, 4, 6]],
  [17, 'Cl', 'Chlorine', 35.45, 0, 'nm', 17, 3, [1, 3, 5, 7]],
  [18, 'Ar', 'Argon', 39.95, 0, 'ng', 18, 3, []],
  [19, 'K', 'Potassium', 39.098, 0, 'am', 1, 4, [1]],
  [20, 'Ca', 'Calcium', 40.078, 0, 'ae', 2, 4, [2]],
  [21, 'Sc', 'Scandium', 44.956, 0, 'tm', 3, 4, [3]],
  [22, 'Ti', 'Titanium', 47.867, 0, 'tm', 4, 4, [2, 3, 4]],
  [23, 'V', 'Vanadium', 50.942, 0, 'tm', 5, 4, [2, 3, 4, 5]],
  [24, 'Cr', 'Chromium', 51.996, 0, 'tm', 6, 4, [2, 3, 6]],
  [25, 'Mn', 'Manganese', 54.938, 0, 'tm', 7, 4, [2, 4, 7]],
  [26, 'Fe', 'Iron', 55.845, 0, 'tm', 8, 4, [2, 3]],
  [27, 'Co', 'Cobalt', 58.933, 0, 'tm', 9, 4, [2, 3]],
  [28, 'Ni', 'Nickel', 58.693, 0, 'tm', 10, 4, [2]],
  [29, 'Cu', 'Copper', 63.546, 0, 'tm', 11, 4, [1, 2]],
  [30, 'Zn', 'Zinc', 65.38, 0, 'tm', 12, 4, [2]],
  [31, 'Ga', 'Gallium', 69.723, 0, 'pt', 13, 4, [3]],
  [32, 'Ge', 'Germanium', 72.63, 0, 'md', 14, 4, [2, 4]],
  [33, 'As', 'Arsenic', 74.922, 0, 'md', 15, 4, [3, 5]],
  [34, 'Se', 'Selenium', 78.971, 0, 'nm', 16, 4, [2, 4, 6]],
  [35, 'Br', 'Bromine', 79.904, 0, 'nm', 17, 4, [1, 3, 5, 7]],
  [36, 'Kr', 'Krypton', 83.798, 0, 'ng', 18, 4, [2]],
  [37, 'Rb', 'Rubidium', 85.468, 0, 'am', 1, 5, [1]],
  [38, 'Sr', 'Strontium', 87.62, 0, 'ae', 2, 5, [2]],
  [39, 'Y', 'Yttrium', 88.906, 0, 'tm', 3, 5, [3]],
  [40, 'Zr', 'Zirconium', 91.224, 0, 'tm', 4, 5, [4]],
  [41, 'Nb', 'Niobium', 92.906, 0, 'tm', 5, 5, [3, 5]],
  [42, 'Mo', 'Molybdenum', 95.95, 0, 'tm', 6, 5, [4, 6]],
  [43, 'Tc', 'Technetium', 98, 1, 'tm', 7, 5, [4, 7]],
  [44, 'Ru', 'Ruthenium', 101.07, 0, 'tm', 8, 5, [3, 4, 8]],
  [45, 'Rh', 'Rhodium', 102.91, 0, 'tm', 9, 5, [3]],
  [46, 'Pd', 'Palladium', 106.42, 0, 'tm', 10, 5, [2, 4]],
  [47, 'Ag', 'Silver', 107.87, 0, 'tm', 11, 5, [1]],
  [48, 'Cd', 'Cadmium', 112.41, 0, 'tm', 12, 5, [2]],
  [49, 'In', 'Indium', 114.82, 0, 'pt', 13, 5, [1, 3]],
  [50, 'Sn', 'Tin', 118.71, 0, 'pt', 14, 5, [2, 4]],
  [51, 'Sb', 'Antimony', 121.76, 0, 'md', 15, 5, [3, 5]],
  [52, 'Te', 'Tellurium', 127.6, 0, 'md', 16, 5, [2, 4, 6]],
  [53, 'I', 'Iodine', 126.9, 0, 'nm', 17, 5, [1, 3, 5, 7]],
  [54, 'Xe', 'Xenon', 131.29, 0, 'ng', 18, 5, [2, 4, 6, 8]],
  [55, 'Cs', 'Caesium', 132.91, 0, 'am', 1, 6, [1]],
  [56, 'Ba', 'Barium', 137.33, 0, 'ae', 2, 6, [2]],
  [57, 'La', 'Lanthanum', 138.91, 0, 'ln', 0, 6, [3]],
  [58, 'Ce', 'Cerium', 140.12, 0, 'ln', 0, 6, [3, 4]],
  [59, 'Pr', 'Praseodymium', 140.91, 0, 'ln', 0, 6, [3]],
  [60, 'Nd', 'Neodymium', 144.24, 0, 'ln', 0, 6, [3]],
  [61, 'Pm', 'Promethium', 145, 1, 'ln', 0, 6, [3]],
  [62, 'Sm', 'Samarium', 150.36, 0, 'ln', 0, 6, [2, 3]],
  [63, 'Eu', 'Europium', 151.96, 0, 'ln', 0, 6, [2, 3]],
  [64, 'Gd', 'Gadolinium', 157.25, 0, 'ln', 0, 6, [3]],
  [65, 'Tb', 'Terbium', 158.93, 0, 'ln', 0, 6, [3]],
  [66, 'Dy', 'Dysprosium', 162.5, 0, 'ln', 0, 6, [3]],
  [67, 'Ho', 'Holmium', 164.93, 0, 'ln', 0, 6, [3]],
  [68, 'Er', 'Erbium', 167.26, 0, 'ln', 0, 6, [3]],
  [69, 'Tm', 'Thulium', 168.93, 0, 'ln', 0, 6, [3]],
  [70, 'Yb', 'Ytterbium', 173.05, 0, 'ln', 0, 6, [2, 3]],
  [71, 'Lu', 'Lutetium', 174.97, 0, 'ln', 0, 6, [3]],
  [72, 'Hf', 'Hafnium', 178.49, 0, 'tm', 4, 6, [4]],
  [73, 'Ta', 'Tantalum', 180.95, 0, 'tm', 5, 6, [5]],
  [74, 'W', 'Tungsten', 183.84, 0, 'tm', 6, 6, [4, 6]],
  [75, 'Re', 'Rhenium', 186.21, 0, 'tm', 7, 6, [4, 7]],
  [76, 'Os', 'Osmium', 190.23, 0, 'tm', 8, 6, [4, 8]],
  [77, 'Ir', 'Iridium', 192.22, 0, 'tm', 9, 6, [3, 4]],
  [78, 'Pt', 'Platinum', 195.08, 0, 'tm', 10, 6, [2, 4]],
  [79, 'Au', 'Gold', 196.97, 0, 'tm', 11, 6, [1, 3]],
  [80, 'Hg', 'Mercury', 200.59, 0, 'tm', 12, 6, [1, 2]],
  [81, 'Tl', 'Thallium', 204.38, 0, 'pt', 13, 6, [1, 3]],
  [82, 'Pb', 'Lead', 207.2, 0, 'pt', 14, 6, [2, 4]],
  [83, 'Bi', 'Bismuth', 208.98, 0, 'pt', 15, 6, [3, 5]],
  [84, 'Po', 'Polonium', 209, 1, 'pt', 16, 6, [2, 4, 6]],
  [85, 'At', 'Astatine', 210, 1, 'md', 17, 6, [1]],
  [86, 'Rn', 'Radon', 222, 1, 'ng', 18, 6, [2]],
  [87, 'Fr', 'Francium', 223, 1, 'am', 1, 7, [1]],
  [88, 'Ra', 'Radium', 226, 1, 'ae', 2, 7, [2]],
  [89, 'Ac', 'Actinium', 227, 1, 'ac', 0, 7, [3]],
  [90, 'Th', 'Thorium', 232.04, 0, 'ac', 0, 7, [4]],
  [91, 'Pa', 'Protactinium', 231.04, 0, 'ac', 0, 7, [5]],
  [92, 'U', 'Uranium', 238.03, 0, 'ac', 0, 7, [3, 4, 5, 6]],
  [93, 'Np', 'Neptunium', 237, 1, 'ac', 0, 7, [3, 4, 5, 6, 7]],
  [94, 'Pu', 'Plutonium', 244, 1, 'ac', 0, 7, [3, 4, 5, 6]],
  [95, 'Am', 'Americium', 243, 1, 'ac', 0, 7, [3]],
  [96, 'Cm', 'Curium', 247, 1, 'ac', 0, 7, [3]],
  [97, 'Bk', 'Berkelium', 247, 1, 'ac', 0, 7, [3, 4]],
  [98, 'Cf', 'Californium', 251, 1, 'ac', 0, 7, [3]],
  [99, 'Es', 'Einsteinium', 252, 1, 'ac', 0, 7, [3]],
  [100, 'Fm', 'Fermium', 257, 1, 'ac', 0, 7, [3]],
  [101, 'Md', 'Mendelevium', 258, 1, 'ac', 0, 7, [2, 3]],
  [102, 'No', 'Nobelium', 259, 1, 'ac', 0, 7, [2]],
  [103, 'Lr', 'Lawrencium', 266, 1, 'ac', 0, 7, [3]],
  [104, 'Rf', 'Rutherfordium', 267, 1, 'tm', 4, 7, [4]],
  [105, 'Db', 'Dubnium', 268, 1, 'tm', 5, 7, [5]],
  [106, 'Sg', 'Seaborgium', 269, 1, 'tm', 6, 7, [6]],
  [107, 'Bh', 'Bohrium', 270, 1, 'tm', 7, 7, [7]],
  [108, 'Hs', 'Hassium', 269, 1, 'tm', 8, 7, [8]],
  [109, 'Mt', 'Meitnerium', 278, 1, 'un', 9, 7, []],
  [110, 'Ds', 'Darmstadtium', 281, 1, 'un', 10, 7, []],
  [111, 'Rg', 'Roentgenium', 282, 1, 'un', 11, 7, []],
  [112, 'Cn', 'Copernicium', 285, 1, 'un', 12, 7, []],
  [113, 'Nh', 'Nihonium', 286, 1, 'un', 13, 7, []],
  [114, 'Fl', 'Flerovium', 289, 1, 'un', 14, 7, []],
  [115, 'Mc', 'Moscovium', 290, 1, 'un', 15, 7, []],
  [116, 'Lv', 'Livermorium', 293, 1, 'un', 16, 7, []],
  [117, 'Ts', 'Tennessine', 294, 1, 'un', 17, 7, []],
  [118, 'Og', 'Oganesson', 294, 1, 'un', 18, 7, []],
];

function toElement([z, symbol, name, mass, iso, cat, group, period, valences]: Row): ElementData {
  let gridColumn = group;
  let gridRow = period;
  if (group === 0) {
    // f-block: La–Lu (57–71) in row 9, Ac–Lr (89–103) in row 10, columns 3–17.
    gridColumn = 3 + (z - (period === 6 ? 57 : 89));
    gridRow = period === 6 ? 9 : 10;
  }
  return {
    atomicNumber: z,
    symbol,
    name,
    mass,
    massIsIsotope: iso === 1,
    category: CAT[cat],
    group: group === 0 ? null : group,
    period,
    valences,
    gridColumn,
    gridRow,
  };
}

export const ELEMENTS: readonly ElementData[] = RAW.map(toElement);

const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol, e]));

export function getElement(symbol: string): ElementData {
  const e = BY_SYMBOL.get(symbol);
  if (!e) throw new Error(`Unknown element symbol: ${symbol}`);
  return e;
}

/** Highest bonding capacity (sum of bond orders) allowed by the sandbox valence rule. */
export function maxValence(symbol: string): number {
  const v = getElement(symbol).valences;
  return v.length ? Math.max(...v) : 0;
}

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  alkali_metal: 'Alkali metal',
  alkaline_earth: 'Alkaline earth metal',
  transition_metal: 'Transition metal',
  post_transition_metal: 'Post-transition metal',
  metalloid: 'Metalloid',
  reactive_nonmetal: 'Reactive nonmetal',
  noble_gas: 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
  unknown: 'Unknown properties',
};

/** CPK / Jmol atom colours for common elements; others fall back to their category colour in the UI. */
export const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF', C: '#909090', N: '#3050F8', O: '#FF0D0D', F: '#90E050', Cl: '#1FF01F',
  Br: '#A62929', I: '#940094', S: '#FFFF30', P: '#FF8000', B: '#FFB5B5', Si: '#F0C8A0',
  Na: '#AB5CF2', K: '#8F40D4', Li: '#CC80FF', Mg: '#8AFF00', Ca: '#3DFF00', Fe: '#E06633',
  Cu: '#C88033', Zn: '#7D80B0', He: '#D9FFFF', Ne: '#B3E3F5', Ar: '#80D1E3', Al: '#BFA6A6',
  Au: '#FFD123', Ag: '#C0C0C0', Hg: '#B8B8D0', Pt: '#D0D0E0', Xe: '#429EB0', U: '#008FFF',
};
