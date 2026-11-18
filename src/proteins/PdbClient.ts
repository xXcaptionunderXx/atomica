/**
 * ATOMICA RCSB Protein Data Bank (PDB) Client
 * Fetches and parses real-world macromolecular 3D structures from rcsb.org.
 * Governed by Section 23.1 and Task TSK-ENG-001.
 */

export interface PdbAtom {
  serial: number;
  name: string;
  resName: string;
  chainId: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  element: string;
}

export interface PdbChain {
  id: string;
  residueCount: number;
  atomCount: number;
}

export interface PdbStructure {
  pdbId: string;
  title?: string;
  experimentalMethod?: string;
  resolutionAngstrom?: number;
  atoms: PdbAtom[];
  chains: PdbChain[];
  sourceUrl: string;
  isExperimental: boolean;
}

/** Pre-bundled minimal Crambin (PDB: 1CRN) fragment for offline resilience and tests */
export const CRAMBIN_1CRN_SNIPPET = `
HEADER    PLANT SEED PROTEIN                      30-APR-81   1CRN
TITLE     WATER STRUCTURE OF A HYDROPHOBIC PROTEIN AT ATOMIC RESOLUTION:
REMARK   2 RESOLUTION.    1.50 ANGSTROMS.
ATOM      1  N   THR A   1      17.047  14.099   3.625  1.00 13.79           N
ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C
ATOM      3  C   THR A   1      15.685  12.755   5.133  1.00  9.19           C
ATOM      4  O   THR A   1      15.268  13.825   5.594  1.00  9.85           O
ATOM      5  CB  THR A   1      18.170  12.703   5.337  1.00 13.02           C
ATOM      6  OG1 THR A   1      19.334  12.829   4.463  1.00 15.06           O
ATOM      7  CG2 THR A   1      18.150  11.454   6.216  1.00 13.79           C
ATOM      8  N   THR A   2      15.115  11.555   5.265  1.00  7.81           N
ATOM      9  CA  THR A   2      13.856  11.469   6.066  1.00  7.51           C
ATOM     10  C   THR A   2      14.164  10.785   7.379  1.00  5.84           C
ATOM     11  O   THR A   2      14.993   9.862   7.448  1.00  7.36           O
END
`;

export class PdbClient {
  private cache: Map<string, PdbStructure> = new Map();

  constructor() {
    // Prime cache with pre-parsed Crambin snippet
    const parsed1crn = this.parsePdbText('1CRN', CRAMBIN_1CRN_SNIPPET);
    this.cache.set('1crn', parsed1crn);
  }

  /**
   * Fetch 3D atomic coordinates from RCSB PDB by 4-letter PDB ID.
   */
  async getStructure(pdbId: string): Promise<PdbStructure | null> {
    const cleanId = pdbId.trim().toLowerCase();
    if (this.cache.has(cleanId)) {
      return this.cache.get(cleanId)!;
    }

    try {
      const url = `https://files.rcsb.org/download/${cleanId.toUpperCase()}.pdb`;
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      const pdbText = await res.text();
      const structure = this.parsePdbText(cleanId.toUpperCase(), pdbText);
      this.cache.set(cleanId, structure);
      return structure;
    } catch {
      return this.cache.get(cleanId) || null;
    }
  }

  /**
   * Parse standard PDB formatted text into structured PdbStructure.
   */
  parsePdbText(pdbId: string, text: string): PdbStructure {
    const lines = text.split('\n');
    const atoms: PdbAtom[] = [];
    const chainMap = new Map<string, Set<number>>();
    let title = '';
    let resolution: number | undefined;

    for (const line of lines) {
      if (line.startsWith('TITLE')) {
        title += line.substring(10).trim() + ' ';
      } else if (line.startsWith('REMARK   2 RESOLUTION.')) {
        const match = line.match(/RESOLUTION\.\s+([\d\.]+)\s+ANGSTROMS/);
        if (match) {
          resolution = parseFloat(match[1]);
        }
      } else if (line.startsWith('ATOM  ') || line.startsWith('HETATM')) {
        const serial = parseInt(line.substring(6, 11).trim(), 10);
        const name = line.substring(12, 16).trim();
        const resName = line.substring(17, 20).trim();
        const chainId = line.substring(21, 22).trim() || 'A';
        const resSeq = parseInt(line.substring(22, 26).trim(), 10);
        const x = parseFloat(line.substring(30, 38).trim());
        const y = parseFloat(line.substring(38, 46).trim());
        const z = parseFloat(line.substring(46, 54).trim());
        const occupancy = parseFloat(line.substring(54, 60).trim() || '1.0');
        const tempFactor = parseFloat(line.substring(60, 66).trim() || '0.0');
        const element = line.substring(76, 78).trim() || name.substring(0, 1);

        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          atoms.push({
            serial,
            name,
            resName,
            chainId,
            resSeq,
            x,
            y,
            z,
            occupancy,
            tempFactor,
            element
          });

          if (!chainMap.has(chainId)) {
            chainMap.set(chainId, new Set());
          }
          chainMap.get(chainId)!.add(resSeq);
        }
      }
    }

    const chains: PdbChain[] = [];
    for (const [id, residues] of chainMap.entries()) {
      chains.push({
        id,
        residueCount: residues.size,
        atomCount: atoms.filter(a => a.chainId === id).length
      });
    }

    return {
      pdbId,
      title: title.trim() || undefined,
      resolutionAngstrom: resolution,
      atoms,
      chains,
      sourceUrl: `https://www.rcsb.org/structure/${pdbId}`,
      isExperimental: true
    };
  }
}
