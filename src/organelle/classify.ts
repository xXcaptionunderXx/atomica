/**
 * Structural classification of a molecule for the organelle layer (TSK-UI-007).
 *
 * Membranes only accept molecules that can physically form them, decided from the atom graph
 * (not from names), so a lipid built atom-by-atom at the atomic layer is recognised too:
 *  - bilayer-lipid: >= 2 long hydrocarbon tails + a polar head (phosphate, amine or sugar)
 *    -> phospholipids, sphingolipids, galactolipids (cylinder-shaped amphiphiles form bilayers)
 *  - sterol: four fused rings + hydroxyl, no long tail -> cholesterol etc. (membrane modulators)
 *  - neutral-lipid: >= 2 tails and no polar head (TAG, DAG) or sterol + tail (cholesteryl ester)
 *    -> lipid-droplet cores
 *  - single-chain-lipid: one tail (fatty acids, lysolipids) -> micelle formers, not bilayers
 *  - molecule: everything else
 * A "tail" is an unbranched, ring-free carbon chain of >= 8 carbons ending in a methyl group.
 */
import type { MoleculeTemplate } from '../sandbox/MoleculeModel';

export type MoleculeRole = 'bilayer-lipid' | 'sterol' | 'neutral-lipid' | 'single-chain-lipid' | 'molecule';

export interface Classification {
  role: MoleculeRole;
  tails: number;
  fusedRings: number;
}

const TAIL_MIN = 8;

export function classifyTemplate(t: Pick<MoleculeTemplate, 'symbols' | 'bonds'>): Classification {
  const n = t.symbols.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of t.bonds) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const inRing = ringAtoms(n, t.bonds, adj);
  const isC = (i: number) => t.symbols[i] === 'C';
  const cNeighbours = (i: number) => adj[i].filter(isC);

  // Tails: walk from each terminal methyl carbon through unbranched, non-ring carbons.
  let tails = 0;
  for (let i = 0; i < n; i++) {
    if (!isC(i) || inRing[i] || cNeighbours(i).length !== 1) continue;
    if (adj[i].some((j) => !isC(j) && t.symbols[j] !== 'H')) continue; // must be a CH3 end
    let prev = i;
    let cur = cNeighbours(i)[0];
    let length = 1;
    while (cur !== undefined && !inRing[cur] && cNeighbours(cur).length === 2) {
      length++;
      const next = cNeighbours(cur).find((j) => j !== prev);
      prev = cur;
      cur = next as number;
    }
    if (cur !== undefined && !inRing[cur]) length++; // the branch/head carbon that ends the chain
    if (length >= TAIL_MIN) tails++;
  }

  const fusedRings = countFusedRingSystemSize(n, t.bonds, inRing, adj);
  const hasP = t.symbols.includes('P');
  const hasN = t.symbols.includes('N');
  const oxygens = t.symbols.filter((s) => s === 'O').length;
  const hydroxylOnRing = t.symbols.some(
    (s, i) => s === 'O' && adj[i].length >= 1 && adj[i].some((j) => inRing[j] && isC(j)) && adj[i].some((j) => t.symbols[j] === 'H'),
  );
  const sugarLikeHead = oxygens >= 8; // galactolipids / glycolipids carry several hydroxyls

  let role: MoleculeRole = 'molecule';
  if (tails >= 2 && (hasP || hasN || sugarLikeHead)) role = 'bilayer-lipid';
  else if (tails >= 2) role = 'neutral-lipid';
  else if (fusedRings >= 4 && tails === 1) role = 'neutral-lipid'; // cholesteryl ester
  else if (fusedRings >= 4 && hydroxylOnRing && tails === 0) role = 'sterol';
  else if (tails === 1) role = 'single-chain-lipid';
  return { role, tails, fusedRings };
}

/** Atoms that lie on a cycle (a bond is cyclic if its ends stay connected without it). */
function ringAtoms(n: number, bonds: [number, number, number][], adj: number[][]): boolean[] {
  const inRing = new Array<boolean>(n).fill(false);
  for (const [a, b] of bonds) {
    if (inRing[a] && inRing[b]) continue;
    const seen = new Uint8Array(n);
    const stack = [a];
    seen[a] = 1;
    let found = false;
    while (stack.length && !found) {
      const cur = stack.pop()!;
      for (const nx of adj[cur]) {
        if (cur === a && nx === b) continue; // skip the bond itself
        if (nx === b) {
          found = true;
          break;
        }
        if (!seen[nx]) {
          seen[nx] = 1;
          stack.push(nx);
        }
      }
    }
    if (found) {
      inRing[a] = true;
      inRing[b] = true;
    }
  }
  return inRing;
}

/** Number of rings in the largest fused ring system (cyclomatic number of its ring-bond graph). */
function countFusedRingSystemSize(n: number, bonds: [number, number, number][], inRing: boolean[], adj: number[][]): number {
  const ringBonds = bonds.filter(([a, b]) => inRing[a] && inRing[b]);
  const seen = new Uint8Array(n);
  let best = 0;
  for (let s = 0; s < n; s++) {
    if (!inRing[s] || seen[s]) continue;
    const comp: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const cur = stack.pop()!;
      comp.push(cur);
      for (const nx of adj[cur]) {
        if (inRing[nx] && !seen[nx] && ringBonds.some(([a, b]) => (a === cur && b === nx) || (a === nx && b === cur))) {
          seen[nx] = 1;
          stack.push(nx);
        }
      }
    }
    const set = new Set(comp);
    const e = ringBonds.filter(([a, b]) => set.has(a) && set.has(b)).length;
    best = Math.max(best, e - comp.length + 1);
  }
  return best;
}
