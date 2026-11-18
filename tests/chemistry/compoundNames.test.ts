import { describe, it, expect } from 'vitest';
import { COMPOUND_LIBRARY, lookupCompound, parseFormula, toHill } from '../../src/chemistry/compoundNames';
import { getElement } from '../../src/chemistry/elements';

describe('Compound name library (TSK-UI-004)', () => {
  it('has at least 500 named entries', () => {
    expect(COMPOUND_LIBRARY.length).toBeGreaterThanOrEqual(500);
  });

  it('every entry uses real element symbols', () => {
    for (const e of COMPOUND_LIBRARY) {
      for (const sym of parseFormula(e.formula).keys()) expect(() => getElement(sym), `${e.name}: ${sym}`).not.toThrow();
    }
  });

  it('parses natural notation including parentheses', () => {
    expect(toHill(parseFormula('Ca(OH)2'))).toBe('CaH2O2');
    expect(toHill(parseFormula('CH3COOH'))).toBe('C2H4O2');
    expect(toHill(parseFormula('K4Fe(CN)6'))).toBe('C6FeK4N6');
    expect(toHill(parseFormula('Ca5(PO4)3OH'))).toBe('Ca5HO13P3');
    expect(() => parseFormula('Ca(OH')).toThrow();
  });

  it('names the examples from the request', () => {
    expect(lookupCompound('CO2')!.name).toBe('Carbon dioxide');
    expect(lookupCompound('O4S', -2)!.name).toBe('Sulfate');
    const glucose = lookupCompound('C6H12O6')!;
    expect(glucose.name).toBe('Glucose');
    expect(glucose.isomers).toContain('Fructose');
  });

  it('reports isomers sharing a formula', () => {
    const c2h6o = lookupCompound('C2H6O')!;
    expect(c2h6o.name).toBe('Ethanol');
    expect(c2h6o.isomers).toContain('Dimethyl ether');
    expect(lookupCompound('C3H6O')!.name).toMatch(/Acetone/);
  });

  it('uses implied charge to pick ions, falling back to the neutral compound', () => {
    expect(lookupCompound('NO2', -1)!.name).toBe('Nitrite');
    expect(lookupCompound('NO2', 0)!.name).toBe('Nitrogen dioxide');
    expect(lookupCompound('HO', -1)!.name).toBe('Hydroxide');
    expect(lookupCompound('CO2', -1)!.name).toBe('Carbon dioxide');
    expect(lookupCompound('C99H3')).toBeNull();
  });

  it('generates correct homologous series names and formulas', () => {
    expect(lookupCompound('C8H18')!.name).toBe('Octane');
    expect(lookupCompound('C20H42')!.name).toBe('Icosane');
    expect(lookupCompound('C18H36O2')!.name).toMatch(/Stearic acid/);
    expect(lookupCompound('C3H8O')!.name).toBe('Propan-1-ol');
    expect(lookupCompound('CH5N')!.name).toBe('Methylamine');
  });
});
