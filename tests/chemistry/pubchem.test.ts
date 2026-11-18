import { describe, it, expect } from 'vitest';
import { PubChemClient } from '../../src/chemistry/PubChemClient';
import { PdbClient, CRAMBIN_1CRN_SNIPPET } from '../../src/proteins/PdbClient';

describe('Real-World Scientific Data Ingestion (TSK-ENG-001)', () => {
  const pubchem = new PubChemClient();
  const pdb = new PdbClient();

  it('retrieves real chemical structure for Creatine (PubChem CID 586)', async () => {
    const creatine = await pubchem.getCompoundByName('creatine');
    expect(creatine).not.toBeNull();
    expect(creatine?.formula).toBe('C4H9N3O2');
    expect(creatine?.molecularWeight).toBeCloseTo(131.13, 1);
    expect(creatine?.atoms.length).toBeGreaterThanOrEqual(8);
    expect(creatine?.bonds.length).toBeGreaterThanOrEqual(7);
  });

  it('retrieves real chemical structure for Water (PubChem CID 962)', async () => {
    const water = await pubchem.getCompoundByName('water');
    expect(water).not.toBeNull();
    expect(water?.formula).toBe('H2O');
    expect(water?.molecularWeight).toBeCloseTo(18.015, 2);
    expect(water?.atoms.length).toBe(3);
    expect(water?.bonds.length).toBe(2);
  });

  it('parses real macromolecular atomic coordinates from PDB (Crambin 1CRN)', async () => {
    const crambin = pdb.parsePdbText('1CRN', CRAMBIN_1CRN_SNIPPET);
    expect(crambin.pdbId).toBe('1CRN');
    expect(crambin.resolutionAngstrom).toBe(1.50);
    expect(crambin.atoms.length).toBe(11);
    expect(crambin.chains.length).toBe(1);
    expect(crambin.chains[0].id).toBe('A');

    // Verify first atom (N of Thr 1)
    const atom1 = crambin.atoms[0];
    expect(atom1.name).toBe('N');
    expect(atom1.resName).toBe('THR');
    expect(atom1.x).toBeCloseTo(17.047, 3);
    expect(atom1.y).toBeCloseTo(14.099, 3);
    expect(atom1.z).toBeCloseTo(3.625, 3);
  });
});
