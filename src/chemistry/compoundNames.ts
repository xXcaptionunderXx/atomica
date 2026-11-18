/**
 * ATOMICA compound name library — Task TSK-UI-004.
 *
 * Maps a molecular formula (+ charge for ions) to common/IUPAC names. Entries are written in
 * natural notation (e.g. "Ca(OH)2", "CH3COOH") and converted to Hill notation at load time.
 *
 * LIMITATION (explicit): matching is by formula and implied charge only, not by structure.
 * Formulas shared by several compounds (isomers, e.g. C2H6O = ethanol / dimethyl ether) return
 * the first-listed name as primary and the rest as `isomers`.
 */

export interface CompoundEntry {
  formula: string; // Hill notation
  name: string;
  charge: number;
}

export interface CompoundMatch {
  name: string;
  charge: number;
  isomers: string[];
}

// ---------------------------------------------------------------------------
// Formula parsing
// ---------------------------------------------------------------------------

/** Parse "Ca(OH)2", "CH3COONa", "K4Fe(CN)6" into element counts. */
export function parseFormula(text: string): Map<string, number> {
  let i = 0;
  const parseGroup = (): Map<string, number> => {
    const counts = new Map<string, number>();
    while (i < text.length && text[i] !== ')') {
      let part: Map<string, number>;
      if (text[i] === '(') {
        i++;
        part = parseGroup();
        if (text[i] !== ')') throw new Error(`Unbalanced parentheses in ${text}`);
        i++;
      } else {
        const m = /^[A-Z][a-z]?/.exec(text.slice(i));
        if (!m) throw new Error(`Bad formula "${text}" at ${i}`);
        i += m[0].length;
        part = new Map([[m[0], 1]]);
      }
      const num = /^\d+/.exec(text.slice(i));
      const mult = num ? Number(num[0]) : 1;
      if (num) i += num[0].length;
      for (const [el, c] of part) counts.set(el, (counts.get(el) ?? 0) + c * mult);
    }
    return counts;
  };
  const result = parseGroup();
  if (i !== text.length) throw new Error(`Unbalanced parentheses in ${text}`);
  return result;
}

export function toHill(counts: Map<string, number>): string {
  const keys = [...counts.keys()];
  const order = counts.has('C')
    ? ['C', ...(counts.has('H') ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H').sort()]
    : keys.sort();
  return order.map((k) => (counts.get(k)! > 1 ? `${k}${counts.get(k)}` : k)).join('');
}

// ---------------------------------------------------------------------------
// Generated homologous series (names follow IUPAC 2013 recommendations)
// ---------------------------------------------------------------------------

const STEMS = [
  '', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec',
  'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos',
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const CH = (c: number, h: number, rest = '') => `C${c}H${h}${rest}`;

const ACID_COMMON: Record<number, string> = {
  1: 'Formic acid', 2: 'Acetic acid', 3: 'Propionic acid', 4: 'Butyric acid', 5: 'Valeric acid',
  6: 'Caproic acid', 8: 'Caprylic acid', 10: 'Capric acid', 12: 'Lauric acid', 14: 'Myristic acid',
  16: 'Palmitic acid', 17: 'Margaric acid', 18: 'Stearic acid', 20: 'Arachidic acid',
};

function generated(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) {
    const s = STEMS[n];
    out.push(`${CH(n, 2 * n + 2)}|${cap(s)}ane`);
    out.push(`${CH(n, 2 * n + 2, 'O')}|${n <= 2 ? cap(s) + 'anol' : cap(s) + 'an-1-ol'}`);
    const acid = `${cap(s)}anoic acid`;
    out.push(`${CH(n, 2 * n, 'O2')}|${ACID_COMMON[n] ? `${ACID_COMMON[n]} (${acid.toLowerCase()})` : acid}`);
    if (n >= 2) out.push(`${CH(n, 2 * n)}|${n === 2 ? 'Ethylene (ethene)' : n === 3 ? 'Propene (propylene)' : cap(s) + '-1-ene'}`);
    if (n >= 2 && n <= 12) out.push(`${CH(n, 2 * n - 2)}|${n === 2 ? 'Acetylene (ethyne)' : n === 3 ? 'Propyne' : cap(s) + '-1-yne'}`);
    // Ketone listed before the aldehyde so e.g. C3H6O shows "Acetone" first.
    if (n >= 3 && n <= 10) out.push(`${CH(n, 2 * n, 'O')}|${n === 3 ? 'Acetone (propan-2-one)' : cap(s) + 'an-2-one'}`);
    if (n <= 12) {
      const ald = n === 1 ? 'Formaldehyde (methanal)' : n === 2 ? 'Acetaldehyde (ethanal)' : `${cap(s)}anal`;
      out.push(`${CH(n, 2 * n, 'O')}|${ald}`);
    }
    if (n >= 5 && n <= 8) out.push(`${CH(n, 2 * n, 'O')}|${cap(s)}an-3-one`);
    if (n <= 10) out.push(`${CH(n, 2 * n + 3, 'N')}|${n === 1 ? 'Methylamine' : n === 2 ? 'Ethylamine' : cap(s) + 'an-1-amine'}`);
    if (n >= 3 && n <= 10) out.push(`${CH(n, 2 * n)}|Cyclo${s}ane`);
    if (n <= 6) {
      const pos = n >= 3 ? '1-' : '';
      out.push(`${CH(n, 2 * n + 1, 'Cl')}|${cap(pos + 'chloro' + s + 'ane')}`);
      out.push(`${CH(n, 2 * n + 1, 'Br')}|${cap(pos + 'bromo' + s + 'ane')}`);
    }
    if (n <= 4) {
      const pos = n >= 3 ? '1-' : '';
      out.push(`${CH(n, 2 * n + 1, 'I')}|${cap(pos + 'iodo' + s + 'ane')}`);
      out.push(`${CH(n, 2 * n + 1, 'F')}|${cap(pos + 'fluoro' + s + 'ane')}`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Curated entries: formula|name[|charge]. Earlier lines win as the primary name.
// ---------------------------------------------------------------------------

const CURATED = `
H2|Hydrogen gas (dihydrogen)
N2|Nitrogen gas (dinitrogen)
O2|Oxygen gas (dioxygen)
O3|Ozone
F2|Fluorine gas
Cl2|Chlorine gas
Br2|Bromine
I2|Iodine
P4|White phosphorus (tetraphosphorus)
S8|Cyclooctasulfur
C60|Buckminsterfullerene
C70|Fullerene C70
H2O|Water
H2O2|Hydrogen peroxide
NH3|Ammonia
N2H4|Hydrazine
N2H2|Diazene
HN3|Hydrazoic acid
SiH4|Silane
Si2H6|Disilane
GeH4|Germane
PH3|Phosphine
AsH3|Arsine
SbH3|Stibine
H2S|Hydrogen sulfide
H2Se|Hydrogen selenide
H2Te|Hydrogen telluride
HF|Hydrogen fluoride
HCl|Hydrogen chloride
HBr|Hydrogen bromide
HI|Hydrogen iodide
BH3|Borane
B2H6|Diborane
LiH|Lithium hydride
NaH|Sodium hydride
KH|Potassium hydride
CaH2|Calcium hydride
MgH2|Magnesium hydride
AlH3|Aluminium hydride (alane)
LiAlH4|Lithium aluminium hydride
NaBH4|Sodium borohydride
CO|Carbon monoxide
CO2|Carbon dioxide
C3O2|Carbon suboxide
NO|Nitric oxide
NO2|Nitrogen dioxide
N2O|Nitrous oxide
N2O3|Dinitrogen trioxide
N2O4|Dinitrogen tetroxide
N2O5|Dinitrogen pentoxide
SO2|Sulfur dioxide
SO3|Sulfur trioxide
SiO2|Silicon dioxide (silica)
P4O10|Phosphorus pentoxide (tetraphosphorus decaoxide)
P4O6|Tetraphosphorus hexaoxide
Cl2O|Dichlorine monoxide
ClO2|Chlorine dioxide
Cl2O7|Dichlorine heptoxide
OF2|Oxygen difluoride
SeO2|Selenium dioxide
B2O3|Boron trioxide
Al2O3|Aluminium oxide (alumina)
Li2O|Lithium oxide
Na2O|Sodium oxide
Na2O2|Sodium peroxide
K2O|Potassium oxide
KO2|Potassium superoxide
MgO|Magnesium oxide
CaO|Calcium oxide (quicklime)
SrO|Strontium oxide
BaO|Barium oxide
BaO2|Barium peroxide
BeO|Beryllium oxide
FeO|Iron(II) oxide
Fe2O3|Iron(III) oxide (rust, hematite)
Fe3O4|Iron(II,III) oxide (magnetite)
CuO|Copper(II) oxide
Cu2O|Copper(I) oxide
ZnO|Zinc oxide
TiO2|Titanium dioxide
MnO2|Manganese dioxide
Mn2O7|Manganese heptoxide
CrO3|Chromium trioxide
Cr2O3|Chromium(III) oxide
V2O5|Vanadium pentoxide
NiO|Nickel(II) oxide
CoO|Cobalt(II) oxide
Ag2O|Silver oxide
HgO|Mercury(II) oxide
PbO|Lead(II) oxide
PbO2|Lead(IV) oxide
SnO2|Tin(IV) oxide
ZrO2|Zirconium dioxide
UO2|Uranium dioxide
OsO4|Osmium tetroxide
RuO4|Ruthenium tetroxide
XeO3|Xenon trioxide
XeO4|Xenon tetroxide
WO3|Tungsten trioxide
MoO3|Molybdenum trioxide
GeO2|Germanium dioxide
As2O3|Arsenic trioxide
Sb2O3|Antimony trioxide
Bi2O3|Bismuth(III) oxide
La2O3|Lanthanum oxide
CeO2|Cerium(IV) oxide
NaCl|Sodium chloride (table salt)
KCl|Potassium chloride
LiCl|Lithium chloride
NaF|Sodium fluoride
KF|Potassium fluoride
LiF|Lithium fluoride
NaBr|Sodium bromide
KBr|Potassium bromide
NaI|Sodium iodide
KI|Potassium iodide
CsCl|Caesium chloride
MgCl2|Magnesium chloride
CaCl2|Calcium chloride
CaF2|Calcium fluoride (fluorite)
BaCl2|Barium chloride
SrCl2|Strontium chloride
BeCl2|Beryllium chloride
MgF2|Magnesium fluoride
AlCl3|Aluminium chloride
AlF3|Aluminium fluoride
BF3|Boron trifluoride
BCl3|Boron trichloride
BBr3|Boron tribromide
CF4|Tetrafluoromethane
CCl4|Carbon tetrachloride
CBr4|Carbon tetrabromide
CI4|Carbon tetraiodide
SiF4|Silicon tetrafluoride
SiCl4|Silicon tetrachloride
GeCl4|Germanium tetrachloride
SnCl2|Tin(II) chloride
SnCl4|Tin(IV) chloride
PbCl2|Lead(II) chloride
NF3|Nitrogen trifluoride
NCl3|Nitrogen trichloride
PF3|Phosphorus trifluoride
PF5|Phosphorus pentafluoride
PCl3|Phosphorus trichloride
PCl5|Phosphorus pentachloride
PBr3|Phosphorus tribromide
AsF5|Arsenic pentafluoride
SbF5|Antimony pentafluoride
SF4|Sulfur tetrafluoride
SF6|Sulfur hexafluoride
S2Cl2|Disulfur dichloride
SCl2|Sulfur dichloride
SeF6|Selenium hexafluoride
TeF6|Tellurium hexafluoride
ClF|Chlorine monofluoride
ClF3|Chlorine trifluoride
ClF5|Chlorine pentafluoride
BrF3|Bromine trifluoride
BrF5|Bromine pentafluoride
IF5|Iodine pentafluoride
IF7|Iodine heptafluoride
ICl|Iodine monochloride
IBr|Iodine monobromide
BrCl|Bromine monochloride
XeF2|Xenon difluoride
XeF4|Xenon tetrafluoride
XeF6|Xenon hexafluoride
KrF2|Krypton difluoride
FeCl2|Iron(II) chloride
FeCl3|Iron(III) chloride
CuCl|Copper(I) chloride
CuCl2|Copper(II) chloride
ZnCl2|Zinc chloride
AgCl|Silver chloride
AgBr|Silver bromide
AgI|Silver iodide
AgF|Silver fluoride
HgCl2|Mercury(II) chloride
Hg2Cl2|Mercury(I) chloride (calomel)
TiCl4|Titanium tetrachloride
UF6|Uranium hexafluoride
WF6|Tungsten hexafluoride
NiCl2|Nickel(II) chloride
CoCl2|Cobalt(II) chloride
MnCl2|Manganese(II) chloride
CrCl3|Chromium(III) chloride
SOCl2|Thionyl chloride
SO2Cl2|Sulfuryl chloride
POCl3|Phosphoryl chloride
COCl2|Phosgene
COF2|Carbonyl fluoride
NOCl|Nitrosyl chloride
CS2|Carbon disulfide
COS|Carbonyl sulfide
HCN|Hydrogen cyanide
HNC|Hydrogen isocyanide
C2N2|Cyanogen
ClCN|Cyanogen chloride
BrCN|Cyanogen bromide
HNCO|Isocyanic acid
HOCN|Cyanic acid
HSCN|Thiocyanic acid
Na2S|Sodium sulfide
FeS|Iron(II) sulfide
FeS2|Iron disulfide (pyrite)
ZnS|Zinc sulfide
CuS|Copper(II) sulfide
PbS|Lead(II) sulfide (galena)
HgS|Mercury(II) sulfide (cinnabar)
Ag2S|Silver sulfide
MoS2|Molybdenum disulfide
CdS|Cadmium sulfide
SiC|Silicon carbide
CaC2|Calcium carbide
Mg3N2|Magnesium nitride
Li3N|Lithium nitride
BN|Boron nitride
AlN|Aluminium nitride
GaN|Gallium nitride
GaAs|Gallium arsenide
InP|Indium phosphide
Si3N4|Silicon nitride
WC|Tungsten carbide
TiN|Titanium nitride
NaN3|Sodium azide
Ca3P2|Calcium phosphide
S4N4|Tetrasulfur tetranitride
H2SO4|Sulfuric acid
H2SO3|Sulfurous acid
HNO3|Nitric acid
HNO2|Nitrous acid
H3PO4|Phosphoric acid
H3PO3|Phosphorous acid
H3PO2|Hypophosphorous acid
H2CO3|Carbonic acid
HClO|Hypochlorous acid
HClO2|Chlorous acid
HClO3|Chloric acid
HClO4|Perchloric acid
HBrO3|Bromic acid
HIO3|Iodic acid
HIO4|Periodic acid
H3BO3|Boric acid
H2CrO4|Chromic acid
HMnO4|Permanganic acid
H2SiO3|Metasilicic acid
H4SiO4|Orthosilicic acid
H2S2O7|Disulfuric acid (oleum)
H2S2O3|Thiosulfuric acid
H4P2O7|Pyrophosphoric acid
HPO3|Metaphosphoric acid
H3AsO4|Arsenic acid
H2SeO4|Selenic acid
HSO3F|Fluorosulfuric acid
HSO3Cl|Chlorosulfuric acid
HBF4|Tetrafluoroboric acid
H2SiF6|Hexafluorosilicic acid
NaOH|Sodium hydroxide (lye)
KOH|Potassium hydroxide
LiOH|Lithium hydroxide
CsOH|Caesium hydroxide
Ca(OH)2|Calcium hydroxide (slaked lime)
Mg(OH)2|Magnesium hydroxide
Ba(OH)2|Barium hydroxide
Sr(OH)2|Strontium hydroxide
Al(OH)3|Aluminium hydroxide
Fe(OH)2|Iron(II) hydroxide
Fe(OH)3|Iron(III) hydroxide
Cu(OH)2|Copper(II) hydroxide
Zn(OH)2|Zinc hydroxide
NH2OH|Hydroxylamine
NH4OH|Ammonium hydroxide
Na2CO3|Sodium carbonate (washing soda)
NaHCO3|Sodium bicarbonate (baking soda)
K2CO3|Potassium carbonate
KHCO3|Potassium bicarbonate
CaCO3|Calcium carbonate (limestone)
MgCO3|Magnesium carbonate
BaCO3|Barium carbonate
Li2CO3|Lithium carbonate
FeCO3|Iron(II) carbonate (siderite)
ZnCO3|Zinc carbonate
CuCO3|Copper(II) carbonate
PbCO3|Lead(II) carbonate
Cu2(OH)2CO3|Basic copper carbonate (malachite)
Na2SO4|Sodium sulfate
K2SO4|Potassium sulfate
MgSO4|Magnesium sulfate (Epsom salt)
CaSO4|Calcium sulfate
BaSO4|Barium sulfate
CuSO4|Copper(II) sulfate
FeSO4|Iron(II) sulfate
ZnSO4|Zinc sulfate
NaHSO4|Sodium bisulfate
Na2SO3|Sodium sulfite
NaHSO3|Sodium bisulfite
Na2S2O3|Sodium thiosulfate
Na2S2O5|Sodium metabisulfite
NaNO3|Sodium nitrate
KNO3|Potassium nitrate (saltpetre)
NH4NO3|Ammonium nitrate
AgNO3|Silver nitrate
Ca(NO3)2|Calcium nitrate
Mg(NO3)2|Magnesium nitrate
Pb(NO3)2|Lead(II) nitrate
Ba(NO3)2|Barium nitrate
Cu(NO3)2|Copper(II) nitrate
NaNO2|Sodium nitrite
KNO2|Potassium nitrite
Na3PO4|Trisodium phosphate
Na2HPO4|Disodium phosphate
NaH2PO4|Monosodium phosphate
K3PO4|Tripotassium phosphate
KH2PO4|Monopotassium phosphate
Ca3(PO4)2|Calcium phosphate
CaHPO4|Dicalcium phosphate
Ca5(PO4)3OH|Hydroxyapatite
Ca5(PO4)3F|Fluorapatite
(NH4)3PO4|Ammonium phosphate
(NH4)2SO4|Ammonium sulfate
NH4Cl|Ammonium chloride
NH4HCO3|Ammonium bicarbonate
(NH4)2CO3|Ammonium carbonate
NaClO|Sodium hypochlorite (bleach)
NaClO2|Sodium chlorite
NaClO3|Sodium chlorate
NaClO4|Sodium perchlorate
KClO3|Potassium chlorate
KClO4|Potassium perchlorate
Ca(ClO)2|Calcium hypochlorite
KMnO4|Potassium permanganate
K2MnO4|Potassium manganate
K2CrO4|Potassium chromate
K2Cr2O7|Potassium dichromate
Na2CrO4|Sodium chromate
KIO3|Potassium iodate
KBrO3|Potassium bromate
NaCN|Sodium cyanide
KCN|Potassium cyanide
KSCN|Potassium thiocyanate
K4Fe(CN)6|Potassium ferrocyanide
K3Fe(CN)6|Potassium ferricyanide
Na2SiO3|Sodium metasilicate
Na2B4O7|Sodium tetraborate (anhydrous borax)
Na3AlF6|Cryolite
KAl(SO4)2|Potassium alum (anhydrous)
CaSiO3|Calcium silicate (wollastonite)
Mg2SiO4|Forsterite
ZrSiO4|Zircon
NaNH2|Sodium amide
CH3COONa|Sodium acetate
HCOONa|Sodium formate
C6H5COONa|Sodium benzoate
Na3C6H5O7|Trisodium citrate
CH3CH(OH)COONa|Sodium lactate
C5H8NNaO4|Monosodium glutamate (MSG)
CH3COOK|Potassium acetate
Ca(CH3COO)2|Calcium acetate
C17H35COONa|Sodium stearate (soap)
CH3ONa|Sodium methoxide
C2H5ONa|Sodium ethoxide
C4H9OK|Potassium tert-butoxide
CH3Li|Methyllithium
C4H9Li|n-Butyllithium
OH|Hydroxide|-1
H3O|Hydronium|1
NH4|Ammonium|1
NH2|Amide|-1
CN|Cyanide|-1
SCN|Thiocyanate|-1
OCN|Cyanate|-1
N3|Azide|-1
NO3|Nitrate|-1
NO2|Nitrite|-1
NO2|Nitronium|1
NO|Nitrosonium|1
SO4|Sulfate|-2
HSO4|Hydrogen sulfate (bisulfate)|-1
SO3|Sulfite|-2
HSO3|Hydrogen sulfite (bisulfite)|-1
S2O3|Thiosulfate|-2
S2O8|Peroxydisulfate|-2
PO4|Phosphate|-3
HPO4|Hydrogen phosphate|-2
H2PO4|Dihydrogen phosphate|-1
P2O7|Pyrophosphate|-4
CO3|Carbonate|-2
HCO3|Bicarbonate (hydrogen carbonate)|-1
C2O4|Oxalate|-2
CH3COO|Acetate|-1
HCOO|Formate|-1
ClO|Hypochlorite|-1
ClO2|Chlorite|-1
ClO3|Chlorate|-1
ClO4|Perchlorate|-1
BrO3|Bromate|-1
IO3|Iodate|-1
IO4|Periodate|-1
MnO4|Permanganate|-1
MnO4|Manganate|-2
CrO4|Chromate|-2
Cr2O7|Dichromate|-2
SiO3|Metasilicate|-2
SiO4|Orthosilicate|-4
BO3|Borate|-3
BF4|Tetrafluoroborate|-1
PF6|Hexafluorophosphate|-1
O2|Superoxide|-1
O2|Peroxide|-2
HS|Hydrosulfide|-1
Fe(CN)6|Ferrocyanide (hexacyanoferrate(II))|-4
Fe(CN)6|Ferricyanide (hexacyanoferrate(III))|-3
AsO4|Arsenate|-3
SeO4|Selenate|-2
C6H5O7|Citrate|-3
C3H5O3|Lactate|-1
C3H3O3|Pyruvate|-1
C4H4O4|Succinate|-2
C4H2O4|Fumarate|-2
C7H5O2|Benzoate|-1
C3H6|Cyclopropane
C4H8|But-2-ene
C4H8|Isobutylene (2-methylpropene)
C4H10|Isobutane (2-methylpropane)
C5H12|Isopentane (2-methylbutane)
C5H12|Neopentane (2,2-dimethylpropane)
C6H14|2-Methylpentane
C6H14|3-Methylpentane
C6H14|2,2-Dimethylbutane
C6H14|2,3-Dimethylbutane
C8H18|Isooctane (2,2,4-trimethylpentane)
C3H4|Allene (propadiene)
C4H6|1,3-Butadiene
C4H6|But-2-yne
C5H8|Isoprene
C5H6|Cyclopentadiene
C6H10|Cyclohexene
C6H6|Benzene
C7H8|Toluene
C8H10|Ethylbenzene
C8H10|o-Xylene
C8H10|m-Xylene
C8H10|p-Xylene
C9H12|Cumene (isopropylbenzene)
C9H12|Mesitylene (1,3,5-trimethylbenzene)
C9H12|Propylbenzene
C8H8|Styrene
C8H8|Cyclooctatetraene
C8H8|Cubane
C8H6|Phenylacetylene
C10H8|Naphthalene
C10H8|Azulene
C14H10|Anthracene
C14H10|Phenanthrene
C12H10|Biphenyl
C13H12|Diphenylmethane
C10H16|Limonene
C10H16|alpha-Pinene
C10H16|beta-Pinene
C10H16|Myrcene
C10H16|Adamantane
C10H18|Decalin
C15H24|Caryophyllene
C30H50|Squalene
C6H5OH|Phenol
C6H5NH2|Aniline
C6H5Cl|Chlorobenzene
C6H5Br|Bromobenzene
C6H5I|Iodobenzene
C6H5F|Fluorobenzene
C6H5NO2|Nitrobenzene
C6H5COOH|Benzoic acid
C6H5CHO|Benzaldehyde
C6H5CH2OH|Benzyl alcohol
C6H5OCH3|Anisole
C7H8O|o-Cresol
C7H8O|m-Cresol
C7H8O|p-Cresol
C6H5CN|Benzonitrile
C6H4(OH)2|Catechol
C6H4(OH)2|Resorcinol
C6H4(OH)2|Hydroquinone
C6H4O2|p-Benzoquinone
C6H6O3|Pyrogallol
C6H6O3|Phloroglucinol
C7H5N3O6|TNT (2,4,6-trinitrotoluene)
C6H3N3O7|Picric acid
C6H5COCH3|Acetophenone
C6H5COOCH3|Methyl benzoate
C8H8O2|Phenylacetic acid
C6H4(COOH)2|Phthalic acid
C8H6O4|Terephthalic acid
C8H6O4|Isophthalic acid
C8H4O3|Phthalic anhydride
C6H5SO3H|Benzenesulfonic acid
C12H10O|Diphenyl ether
C13H10O|Benzophenone
C5H5N|Pyridine
C4H5N|Pyrrole
C4H4O|Furan
C4H4S|Thiophene
C3H4N2|Imidazole
C3H4N2|Pyrazole
C4H4N2|Pyrimidine
C4H4N2|Pyrazine
C4H4N2|Pyridazine
C8H7N|Indole
C9H7N|Quinoline
C9H7N|Isoquinoline
C5H4N4|Purine
C5H11N|Piperidine
C4H9N|Pyrrolidine
C4H9NO|Morpholine
C4H8O|Tetrahydrofuran (THF)
C4H8O2|1,4-Dioxane
C2H6O|Dimethyl ether
C3H8O|Propan-2-ol (isopropyl alcohol)
C3H8O|Methoxyethane
C4H10O|Diethyl ether
C4H10O|Butan-2-ol
C4H10O|2-Methylpropan-1-ol (isobutanol)
C4H10O|tert-Butanol
C2H6O2|Ethylene glycol
C3H8O2|Propylene glycol
C3H8O3|Glycerol
C6H12O|Cyclohexanol
C6H10O|Cyclohexanone
C5H8O|Cyclopentanone
C3H6O|Allyl alcohol
C3H6O|Propylene oxide
C2H4O|Ethylene oxide
C2H2O|Ketene
C10H20O|Menthol
C27H46O|Cholesterol
C6H14O6|Sorbitol
C6H14O6|Mannitol
C5H12O5|Xylitol
C4H10O4|Erythritol
C3H4O|Acrolein
C4H6O|Crotonaldehyde
C2H2O2|Glyoxal
C9H8O|Cinnamaldehyde
C8H8O3|Vanillin
C8H8O3|Methyl salicylate
C5H8O2|Acetylacetone
C5H8O2|Methyl methacrylate
C4H6O2|Diacetyl
C4H6O2|Methacrylic acid
C4H6O2|Vinyl acetate
C4H6O2|Methyl acrylate
C10H16O|Camphor
C2H2O4|Oxalic acid
C3H4O4|Malonic acid
C4H6O4|Succinic acid
C5H8O4|Glutaric acid
C6H10O4|Adipic acid
C4H4O4|Fumaric acid
C4H4O4|Maleic acid
C3H6O3|Lactic acid
C3H6O3|Glyceraldehyde
C3H6O3|Dihydroxyacetone
C3H6O3|Dimethyl carbonate
C3H4O3|Pyruvic acid
C3H4O3|Ethylene carbonate
C2H4O3|Glycolic acid
C6H8O7|Citric acid
C4H6O5|Malic acid
C4H6O6|Tartaric acid
C3H4O2|Acrylic acid
C18H34O2|Oleic acid
C18H32O2|Linoleic acid
C18H30O2|alpha-Linolenic acid
C20H32O2|Arachidonic acid
C7H6O3|Salicylic acid
C9H8O4|Aspirin (acetylsalicylic acid)
C6H8O6|Vitamin C (ascorbic acid)
C5H4N4O3|Uric acid
C2HF3O2|Trifluoroacetic acid
C2HCl3O2|Trichloroacetic acid
C2H3ClO2|Chloroacetic acid
C6H8O2|Sorbic acid
C9H8O2|Cinnamic acid
C7H6O5|Gallic acid
C2H2O3|Glyoxylic acid
C4H6O3|Acetic anhydride
C4H6O3|Acetoacetic acid
C4H4O5|Oxaloacetic acid
C5H6O5|alpha-Ketoglutaric acid
HCOOCH3|Methyl formate
HCOOC2H5|Ethyl formate
CH3COOCH3|Methyl acetate
CH3COOC2H5|Ethyl acetate
C5H10O2|Propyl acetate
C6H12O2|Butyl acetate
C6H12O2|Ethyl butyrate
C7H14O2|Isoamyl acetate (banana oil)
C2H7N|Dimethylamine
C3H9N|Trimethylamine
C6H15N|Triethylamine
C2H8N2|Ethylenediamine
C4H12N2|Putrescine
C5H14N2|Cadaverine
CH4N2O|Urea
CH3NO|Formamide
C2H5NO|Acetamide
C3H7NO|Dimethylformamide (DMF)
C2H3N|Acetonitrile
C3H3N|Acrylonitrile
CH3NO2|Nitromethane
C2H5NO2|Nitroethane
C3H5N3O9|Nitroglycerin
C2H3NO|Methyl isocyanate
CH5N3|Guanidine
C3H6N6|Melamine
C6H12N4|Hexamine (methenamine)
C3H6N6O6|RDX
C4H8N8O8|HMX
C5H8N4O12|PETN
CH2N2|Cyanamide
CH2N2|Diazomethane
C6H11NO|Caprolactam
C12H17NO|DEET
C10H14N2|Nicotine
CH2Cl2|Dichloromethane
CHCl3|Chloroform
CHBr3|Bromoform
CHI3|Iodoform
CHF3|Fluoroform
CH2F2|Difluoromethane
CCl2F2|Dichlorodifluoromethane (Freon-12)
CCl3F|Trichlorofluoromethane (Freon-11)
C2HBrClF3|Halothane
C2H3Cl|Vinyl chloride
C2Cl4|Tetrachloroethylene
C2HCl3|Trichloroethylene
C2H4Cl2|1,2-Dichloroethane
C2F4|Tetrafluoroethylene
C14H9Cl5|DDT
C2HCl3O|Chloral
C3H5ClO|Epichlorohydrin
CCl3NO2|Chloropicrin
C4H8Cl2S|Mustard gas
C4H10FO2P|Sarin
CH4S|Methanethiol
C2H6S|Ethanethiol
C2H6S|Dimethyl sulfide
C2H6OS|Dimethyl sulfoxide (DMSO)
CH4N2S|Thiourea
CH4O3S|Methanesulfonic acid
C6H10OS2|Allicin
C6H12O6|Glucose
C6H12O6|Fructose
C6H12O6|Galactose
C6H12O6|Mannose
C5H10O5|Ribose
C5H10O5|Xylose
C5H10O5|Arabinose
C5H10O4|Deoxyribose
C12H22O11|Sucrose
C12H22O11|Lactose
C12H22O11|Maltose
C12H22O11|Trehalose
C6H13O9P|Glucose-6-phosphate
C6H13O9P|Fructose-6-phosphate
C2H5NO2|Glycine
C3H7NO2|Alanine
C3H7NO2|beta-Alanine
C3H7NO2|Sarcosine
C3H7NO3|Serine
C3H7NO2S|Cysteine
C4H9NO3|Threonine
C5H11NO2|Valine
C6H13NO2|Leucine
C6H13NO2|Isoleucine
C5H11NO2S|Methionine
C5H9NO2|Proline
C9H11NO2|Phenylalanine
C9H11NO3|Tyrosine
C11H12N2O2|Tryptophan
C4H7NO4|Aspartic acid
C5H9NO4|Glutamic acid
C4H8N2O3|Asparagine
C5H10N2O3|Glutamine
C6H14N2O2|Lysine
C6H14N4O2|Arginine
C6H9N3O2|Histidine
C3H7NO2Se|Selenocysteine
C5H12N2O2|Ornithine
C6H13N3O3|Citrulline
C2H7NO3S|Taurine
C4H9NO2|GABA (gamma-aminobutyric acid)
C5H5N5|Adenine
C5H5N5O|Guanine
C4H5N3O|Cytosine
C5H6N2O2|Thymine
C4H4N2O2|Uracil
C10H13N5O4|Adenosine
C10H14N5O7P|AMP (adenosine monophosphate)
C10H15N5O10P2|ADP (adenosine diphosphate)
C10H16N5O13P3|ATP (adenosine triphosphate)
C4H9N3O2|Creatine
C4H7N3O|Creatinine
C8H10N4O2|Caffeine
C7H8N4O2|Theobromine
C7H8N4O2|Theophylline
C8H11NO2|Dopamine
C10H12N2O|Serotonin
C9H13NO3|Adrenaline (epinephrine)
C8H11NO3|Noradrenaline (norepinephrine)
C8H11NO3|Pyridoxine (vitamin B6)
C13H16N2O2|Melatonin
C5H9N3|Histamine
C7H16NO2|Acetylcholine|1
C5H14NO|Choline|1
C19H28O2|Testosterone
C18H24O2|Estradiol
C21H30O2|Progesterone
C21H30O2|THC (tetrahydrocannabinol)
C21H30O2|Cannabidiol (CBD)
C21H30O5|Cortisol
C20H30O|Retinol (vitamin A)
C40H56|beta-Carotene
C6H5NO2|Niacin (vitamin B3)
C6H6N2O|Nicotinamide
C17H20N4O6|Riboflavin (vitamin B2)
C10H16N2O3S|Biotin (vitamin B7)
C19H19N7O6|Folic acid (vitamin B9)
C29H50O2|Vitamin E (alpha-tocopherol)
C27H44O|Vitamin D3 (cholecalciferol)
C31H46O2|Vitamin K1 (phylloquinone)
C34H32FeN4O4|Heme b
C55H72MgN4O5|Chlorophyll a
C8H9NO2|Paracetamol (acetaminophen)
C13H18O2|Ibuprofen
C14H14O3|Naproxen
C17H19NO3|Morphine
C18H21NO3|Codeine
C21H23NO5|Heroin (diacetylmorphine)
C17H21NO4|Cocaine
C9H13N|Amphetamine
C10H15N|Methamphetamine
C11H15NO2|MDMA
C20H25N3O|LSD
C12H17N2O4P|Psilocybin
C16H18N2O4S|Penicillin G
C16H19N3O5S|Amoxicillin
C4H11N5|Metformin
C16H13ClN2O|Diazepam
C17H18F3NO|Fluoxetine
C22H30N6O4S|Sildenafil
C14H22N2O|Lidocaine
C13H20N2O2|Procaine
C20H24N2O2|Quinine
C15H22O5|Artemisinin
C18H27NO3|Capsaicin
C19H16O4|Warfarin
C13H21NO3|Salbutamol (albuterol)
C17H21NO|Diphenhydramine
C17H19N3O3S|Omeprazole
C3H8NO5P|Glyphosate
C8H14ClN5|Atrazine
C10H16N2O8|EDTA
C15H24O|BHT (butylated hydroxytoluene)
PtCl2(NH3)2|Cisplatin
Fe(C5H5)2|Ferrocene
Fe(CO)5|Iron pentacarbonyl
Ni(CO)4|Nickel tetracarbonyl
Cr(CO)6|Chromium hexacarbonyl
Pb(C2H5)4|Tetraethyllead
Si(CH3)4|Tetramethylsilane (TMS)
`;

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

function buildLibrary(): CompoundEntry[] {
  const lines = [...generated(), ...CURATED.split('\n')].map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: CompoundEntry[] = [];
  for (const line of lines) {
    const [raw, name, charge] = line.split('|');
    const entry = { formula: toHill(parseFormula(raw)), name, charge: charge ? Number(charge) : 0 };
    const key = `${entry.formula}|${entry.charge}|${entry.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

export const COMPOUND_LIBRARY: readonly CompoundEntry[] = buildLibrary();

const INDEX = new Map<string, CompoundEntry[]>();
for (const e of COMPOUND_LIBRARY) {
  const key = `${e.formula}|${e.charge}`;
  if (!INDEX.has(key)) INDEX.set(key, []);
  INDEX.get(key)!.push(e);
}

/**
 * Name for a Hill formula. Prefers an entry with the given implied charge, falling back to the
 * neutral compound (the sandbox does not track charge, so an unfilled valence is ambiguous).
 */
export function lookupCompound(hillFormula: string, impliedCharge = 0): CompoundMatch | null {
  const hits = INDEX.get(`${hillFormula}|${impliedCharge}`) ?? INDEX.get(`${hillFormula}|0`);
  if (!hits || hits.length === 0) return null;
  return { name: hits[0].name, charge: hits[0].charge, isomers: hits.slice(1).map((h) => h.name) };
}
