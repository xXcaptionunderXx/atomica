import { describe, it, expect } from 'vitest';
import { ELEMENTS, getElement, maxValence } from '../../src/chemistry/elements';

describe('Periodic table data (TSK-UI-001)', () => {
  it('contains all 118 elements in atomic-number order with unique symbols', () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((e, i) => expect(e.atomicNumber).toBe(i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
  });

  it('matches IUPAC standard atomic weights for reference elements', () => {
    expect(getElement('H').mass).toBeCloseTo(1.008, 3);
    expect(getElement('C').mass).toBeCloseTo(12.011, 3);
    expect(getElement('N').mass).toBeCloseTo(14.007, 3);
    expect(getElement('O').mass).toBeCloseTo(15.999, 3);
    expect(getElement('Na').mass).toBeCloseTo(22.99, 2);
    expect(getElement('Cl').mass).toBeCloseTo(35.45, 2);
    expect(getElement('Fe').mass).toBeCloseTo(55.845, 3);
    expect(getElement('Au').mass).toBeCloseTo(196.97, 2);
    expect(getElement('U').mass).toBeCloseTo(238.03, 2);
  });

  it('flags elements without a standard atomic weight', () => {
    for (const s of ['Tc', 'Pm', 'Po', 'Rn', 'Og']) expect(getElement(s).massIsIsotope).toBe(true);
    for (const s of ['C', 'Th', 'U', 'Pa']) expect(getElement(s).massIsIsotope).toBe(false);
  });

  it('lays out the 18-column table with no two elements in the same cell', () => {
    const cells = new Set(ELEMENTS.map((e) => `${e.gridRow},${e.gridColumn}`));
    expect(cells.size).toBe(118);
    expect(getElement('He')).toMatchObject({ gridRow: 1, gridColumn: 18 });
    expect(getElement('La')).toMatchObject({ gridRow: 9, gridColumn: 3 });
    expect(getElement('Lu')).toMatchObject({ gridRow: 9, gridColumn: 17 });
    expect(getElement('Lr')).toMatchObject({ gridRow: 10, gridColumn: 17 });
    expect(getElement('Hf')).toMatchObject({ gridRow: 6, gridColumn: 4 });
    for (const e of ELEMENTS) {
      expect(e.gridColumn).toBeGreaterThanOrEqual(1);
      expect(e.gridColumn).toBeLessThanOrEqual(18);
    }
  });

  it('uses textbook valences for main-group elements', () => {
    expect(maxValence('H')).toBe(1);
    expect(maxValence('C')).toBe(4);
    expect(maxValence('N')).toBe(3);
    expect(maxValence('O')).toBe(2);
    expect(maxValence('S')).toBe(6);
    expect(maxValence('Ne')).toBe(0);
    expect(maxValence('Xe')).toBe(8);
  });
});
