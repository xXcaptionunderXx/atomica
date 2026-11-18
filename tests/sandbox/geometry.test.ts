import { describe, it, expect } from 'vitest';
import { layoutFragment, bondLengthAngstrom, PX_PER_ANGSTROM, type GeoAtom, type GeoBond } from '../../src/sandbox/Geometry';

/** Build a star molecule: centre atom bonded to ligands with given orders. */
function star(center: string, ligands: string[], orders?: number[]) {
  const atoms: GeoAtom[] = [{ id: 1, symbol: center, x: 0, y: 0 }];
  const bonds: GeoBond[] = [];
  ligands.forEach((s, i) => {
    atoms.push({ id: i + 2, symbol: s, x: 0, y: 0 });
    bonds.push({ id: i + 1, a: 1, b: i + 2, order: orders?.[i] ?? 1 });
  });
  return { atoms, bonds, layout: layoutFragment(atoms, bonds) };
}

function angleDeg(layout: ReturnType<typeof layoutFragment>, a: number, center: number, b: number): number {
  const p = layout.positions;
  const c = p.get(center)!;
  const u = p.get(a)!;
  const v = p.get(b)!;
  const a1 = Math.atan2(u.y - c.y, u.x - c.x);
  const a2 = Math.atan2(v.y - c.y, v.x - c.x);
  let d = Math.abs(a1 - a2) * (180 / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}

describe('VSEPR geometry layout (TSK-UI-004)', () => {
  it('water is bent at 104.5° with two lone pairs', () => {
    const { layout } = star('O', ['H', 'H']);
    const g = layout.geometry.get(1)!;
    expect(g.shape).toBe('bent');
    expect(g.lonePairs).toBe(2);
    expect(g.lonePairAngles).toHaveLength(2);
    expect(angleDeg(layout, 2, 1, 3)).toBeCloseTo(104.5, 6);
  });

  it('CO2 (double bonds) is linear at 180°', () => {
    const { layout } = star('C', ['O', 'O'], [2, 2]);
    expect(layout.geometry.get(1)!.shape).toBe('linear');
    expect(angleDeg(layout, 2, 1, 3)).toBeCloseTo(180, 6);
  });

  it('methane is tetrahedral: 109.5° in-plane pair plus a wedge and a dash', () => {
    const { layout } = star('C', ['H', 'H', 'H', 'H']);
    expect(layout.geometry.get(1)!.shape).toBe('tetrahedral');
    expect(layout.geometry.get(1)!.angleLabel).toBe('109.5°');
    const depths = [...layout.bondStyles.values()].map((s) => s.depth).sort();
    expect(depths).toEqual([-1, 1]);
  });

  it('classifies textbook VSEPR shapes', () => {
    expect(star('B', ['F', 'F', 'F']).layout.geometry.get(1)!.shape).toBe('trigonal planar');
    expect(star('N', ['H', 'H', 'H']).layout.geometry.get(1)!.shape).toBe('trigonal pyramidal');
    expect(star('S', ['O', 'O'], [2, 1]).layout.geometry.get(1)!.shape).toBe('bent'); // SO2-like, 1 LP
    expect(star('P', ['Cl', 'Cl', 'Cl', 'Cl', 'Cl']).layout.geometry.get(1)!.shape).toBe('trigonal bipyramidal');
    expect(star('S', ['F', 'F', 'F', 'F']).layout.geometry.get(1)!.shape).toBe('seesaw');
    expect(star('Cl', ['F', 'F', 'F']).layout.geometry.get(1)!.shape).toBe('T-shaped');
    expect(star('Xe', ['F', 'F']).layout.geometry.get(1)!.shape).toBe('linear');
    expect(star('S', Array(6).fill('F')).layout.geometry.get(1)!.shape).toBe('octahedral');
    expect(star('Br', Array(5).fill('F')).layout.geometry.get(1)!.shape).toBe('square pyramidal');
    expect(star('Xe', Array(4).fill('F')).layout.geometry.get(1)!.shape).toBe('square planar');
  });

  it('draws BF3 at 120° between every pair', () => {
    const { layout } = star('B', ['F', 'F', 'F']);
    expect(angleDeg(layout, 2, 1, 3)).toBeCloseTo(120, 6);
    expect(angleDeg(layout, 3, 1, 4)).toBeCloseTo(120, 6);
  });

  it('uses covalent-radius bond lengths (O–H ≈ 0.97 Å, C=O shorter than C–O)', () => {
    const { layout } = star('O', ['H', 'H']);
    const o = layout.positions.get(1)!;
    const h = layout.positions.get(2)!;
    expect(Math.hypot(h.x - o.x, h.y - o.y) / PX_PER_ANGSTROM).toBeCloseTo(0.97, 2);
    expect(bondLengthAngstrom('C', 'O', 2)).toBeLessThan(bondLengthAngstrom('C', 'O', 1));
  });

  it('draws benzene as a regular hexagon', () => {
    const atoms: GeoAtom[] = [];
    const bonds: GeoBond[] = [];
    for (let i = 1; i <= 6; i++) atoms.push({ id: i, symbol: 'C', x: 0, y: 0 });
    for (let i = 1; i <= 6; i++) bonds.push({ id: i, a: i, b: (i % 6) + 1, order: i % 2 ? 2 : 1 });
    for (let i = 1; i <= 6; i++) {
      atoms.push({ id: 6 + i, symbol: 'H', x: 0, y: 0 });
      bonds.push({ id: 6 + i, a: i, b: 6 + i, order: 1 });
    }
    const layout = layoutFragment(atoms, bonds);
    const d = (a: number, b: number) => {
      const p = layout.positions.get(a)!;
      const q = layout.positions.get(b)!;
      return Math.hypot(p.x - q.x, p.y - q.y);
    };
    const ring = [1, 2, 3, 4, 5, 6].map((i) => d(i, (i % 6) + 1));
    for (const r of ring) expect(r).toBeCloseTo(ring[0], 6);
    expect(angleDeg(layout, 6, 1, 2)).toBeCloseTo(120, 6);
  });

  it('keeps the fragment centred where the user placed it', () => {
    const atoms: GeoAtom[] = [
      { id: 1, symbol: 'O', x: 300, y: 200 },
      { id: 2, symbol: 'H', x: 340, y: 200 },
      { id: 3, symbol: 'H', x: 260, y: 230 },
    ];
    const layout = layoutFragment(atoms, [
      { id: 1, a: 1, b: 2, order: 1 },
      { id: 2, a: 1, b: 3, order: 1 },
    ]);
    const cx = [...layout.positions.values()].reduce((s, p) => s + p.x, 0) / 3;
    expect(cx).toBeCloseTo(300, 6);
  });
});
