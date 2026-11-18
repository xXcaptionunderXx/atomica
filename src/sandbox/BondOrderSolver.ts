/**
 * Bond-order assignment for the 2D sandbox — Task TSK-UI-004.
 *
 * Given a fixed connectivity, choose an order (1–3) for every bond so that as many atoms as
 * possible land exactly on one of their allowed valences (see chemistry/elements.ts).
 * Ties are broken by (1) changing as few bonds as possible from their current order, then
 * (2) the lowest total bond order. Exact branch-and-bound search with a node budget;
 * `exhaustive` is false if the budget ran out (result is then the best found so far).
 *
 * Easy mode applies the solution automatically. Hard mode compares the user's orders with it
 * and flags differing bonds — if the user's assignment is already optimal, nothing is flagged.
 */

export interface OrderAtom {
  id: number;
  valences: number[];
}

export interface OrderBond {
  id: number;
  a: number;
  b: number;
  order: number;
}

export interface OrderSolution {
  /** bondId → order */
  orders: Map<number, number>;
  satisfied: number;
  exhaustive: boolean;
}

interface Score {
  sat: number;
  diff: number;
  total: number;
}

function better(x: Score, y: Score): boolean {
  if (x.sat !== y.sat) return x.sat > y.sat;
  if (x.diff !== y.diff) return x.diff < y.diff;
  return x.total < y.total;
}

export const DEFAULT_NODE_BUDGET = 250_000;

export function solveBondOrders(
  atoms: OrderAtom[],
  bonds: OrderBond[],
  nodeBudget = DEFAULT_NODE_BUDGET,
): OrderSolution {
  const idx = new Map(atoms.map((a, i) => [a.id, i]));
  const n = atoms.length;
  const maxV = atoms.map((a) => (a.valences.length ? Math.max(...a.valences) : 0));
  const allowed = atoms.map((a) => new Set(a.valences));
  const incident: number[][] = atoms.map(() => []);
  bonds.forEach((b, i) => {
    incident[idx.get(b.a)!].push(i);
    incident[idx.get(b.b)!].push(i);
  });

  const current = new Map(bonds.map((b) => [b.id, b.order]));
  const currentScore = (): number => {
    const used = new Array(n).fill(0);
    for (const b of bonds) {
      used[idx.get(b.a)!] += b.order;
      used[idx.get(b.b)!] += b.order;
    }
    return used.filter((u, i) => allowed[i].has(u)).length;
  };

  // Infeasible even with all single bonds → leave as is.
  if (incident.some((inc, i) => inc.length > maxV[i])) {
    return { orders: current, satisfied: currentScore(), exhaustive: true };
  }

  // Visit bonds in BFS order so atoms get finalised early (tighter bounds).
  const order: number[] = [];
  const seenBond = new Set<number>();
  const seenAtom = new Set<number>();
  for (let s = 0; s < n; s++) {
    if (seenAtom.has(s)) continue;
    const queue = [s];
    seenAtom.add(s);
    while (queue.length) {
      const x = queue.shift()!;
      for (const bi of incident[x]) {
        if (seenBond.has(bi)) continue;
        seenBond.add(bi);
        order.push(bi);
        const b = bonds[bi];
        const other = idx.get(b.a) === x ? idx.get(b.b)! : idx.get(b.a)!;
        if (!seenAtom.has(other)) {
          seenAtom.add(other);
          queue.push(other);
        }
      }
    }
  }

  const remaining = incident.map((inc) => inc.length);
  const used = new Array(n).fill(0);
  let sat0 = 0;
  let unfinal0 = 0;
  for (let i = 0; i < n; i++) {
    if (remaining[i] === 0) {
      if (allowed[i].has(0)) sat0++;
    } else unfinal0++;
  }

  // The current assignment seeds the search only if it is itself valid (it can exceed a valence
  // right after a new single bond is added next to existing multiple bonds).
  const currentUsed = new Array(n).fill(0);
  for (const b of bonds) {
    currentUsed[idx.get(b.a)!] += b.order;
    currentUsed[idx.get(b.b)!] += b.order;
  }
  const currentValid = currentUsed.every((u, i) => u <= maxV[i]) && bonds.every((b) => b.order >= 1 && b.order <= 3);
  let best: Score = currentValid
    ? { sat: currentScore(), diff: 0, total: bonds.reduce((s, b) => s + b.order, 0) }
    : { sat: -1, diff: Infinity, total: Infinity };
  let bestOrders = bonds.map((b) => b.order);
  const assign = new Array(bonds.length).fill(0);
  let nodes = 0;
  let exhaustive = true;
  const B = order.length;

  const dfs = (k: number, sat: number, unfinal: number, diff: number, total: number): void => {
    if (++nodes > nodeBudget) {
      exhaustive = false;
      return;
    }
    if (!better({ sat: sat + unfinal, diff, total: total + (B - k) }, best)) return;
    if (k === B) {
      best = { sat, diff, total };
      bestOrders = assign.slice();
      return;
    }
    const bi = order[k];
    const b = bonds[bi];
    const ia = idx.get(b.a)!;
    const ib = idx.get(b.b)!;
    remaining[ia]--;
    remaining[ib]--;
    const hi = Math.min(3, maxV[ia] - used[ia] - remaining[ia], maxV[ib] - used[ib] - remaining[ib]);
    const candidates: number[] = [];
    if (b.order >= 1 && b.order <= hi) candidates.push(b.order);
    for (let o = 1; o <= hi; o++) if (o !== b.order) candidates.push(o);
    for (const o of candidates) {
      used[ia] += o;
      used[ib] += o;
      assign[bi] = o;
      let ds = 0;
      let du = 0;
      for (const e of [ia, ib]) {
        if (remaining[e] === 0) {
          du++;
          if (allowed[e].has(used[e])) ds++;
        }
      }
      dfs(k + 1, sat + ds, unfinal - du, diff + (o !== b.order ? 1 : 0), total + o);
      used[ia] -= o;
      used[ib] -= o;
      if (!exhaustive) break;
    }
    remaining[ia]++;
    remaining[ib]++;
  };
  dfs(0, sat0, unfinal0, 0, 0);

  return {
    orders: new Map(bonds.map((b, i) => [b.id, bestOrders[i]])),
    satisfied: best.sat,
    exhaustive,
  };
}
