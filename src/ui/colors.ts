/** Atom colouring for the 2D sandbox: CPK/Jmol where defined, otherwise the element's category colour. */

import { CPK_COLORS, getElement } from '../chemistry/elements';

export function atomFill(symbol: string): string {
  return CPK_COLORS[symbol] ?? `var(--c-${getElement(symbol).category})`;
}

/** Black or white label, chosen by luminance of the CPK colour; category colours follow the theme text. */
export function textColorFor(symbol: string): string {
  const hex = CPK_COLORS[symbol];
  if (!hex) return 'var(--text)';
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 140 ? '#111111' : '#ffffff';
}
