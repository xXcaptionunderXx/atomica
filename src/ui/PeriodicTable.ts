/**
 * Periodic table strip: renders all 118 elements and lets the user drag one out
 * (pointer events, works with mouse, pen and touch) or click it. Task TSK-UI-001.
 */

import { CATEGORY_LABELS, ELEMENTS, type ElementData } from '../chemistry/elements';
import { atomFill, textColorFor } from './colors';

export interface PeriodicTableCallbacks {
  /** Fired when an element is released at a screen point after dragging. */
  onDrop(symbol: string, clientX: number, clientY: number): void;
  /** Fired on a click without drag. */
  onClick(symbol: string): void;
  onHover(element: ElementData | null): void;
}

const DRAG_THRESHOLD_PX = 4;

export function describeElement(e: ElementData): string {
  const mass = e.massIsIsotope ? `[${e.mass}]` : e.mass.toString();
  const val = e.valences.length ? `valence ${e.valences.join('/')}` : 'no established bonding chemistry';
  return `${e.atomicNumber} ${e.name} (${e.symbol}) · ${mass} g/mol · ${CATEGORY_LABELS[e.category]} · ${val}`;
}

export function renderPeriodicTable(container: HTMLElement, cb: PeriodicTableCallbacks): void {
  container.innerHTML = '';

  for (const e of ELEMENTS) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.gridColumn = String(e.gridColumn);
    tile.style.gridRow = String(e.gridRow); // rows 9–10 = f-block; row 8 is a spacer
    tile.style.background = `var(--c-${e.category})`;
    tile.dataset.symbol = e.symbol;
    tile.title = describeElement(e);
    tile.innerHTML = `<span class="z">${e.atomicNumber}</span>${e.symbol}`;
    tile.addEventListener('pointerenter', () => cb.onHover(e));
    tile.addEventListener('pointerleave', () => cb.onHover(null));
    tile.addEventListener('pointerdown', (ev) => startDrag(ev, e, cb));
    container.appendChild(tile);
  }

  // f-block placeholders in group 3, periods 6 and 7.
  for (const [row, label] of [[6, '57–71'], [7, '89–103']] as const) {
    const ph = document.createElement('div');
    ph.className = 'tile placeholder';
    ph.style.gridColumn = '3';
    ph.style.gridRow = String(row);
    ph.textContent = label;
    container.appendChild(ph);
  }
}

function startDrag(ev: PointerEvent, e: ElementData, cb: PeriodicTableCallbacks): void {
  if (ev.button !== 0) return;
  ev.preventDefault();
  const startX = ev.clientX;
  const startY = ev.clientY;
  let ghost: HTMLDivElement | null = null;

  const move = (m: PointerEvent) => {
    if (!ghost && Math.hypot(m.clientX - startX, m.clientY - startY) > DRAG_THRESHOLD_PX) {
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.textContent = e.symbol;
      ghost.style.background = atomFill(e.symbol);
      ghost.style.color = textColorFor(e.symbol);
      document.body.appendChild(ghost);
      document.body.style.cursor = 'grabbing';
    }
    if (ghost) {
      ghost.style.left = `${m.clientX}px`;
      ghost.style.top = `${m.clientY}px`;
    }
  };

  const up = (u: PointerEvent) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    document.body.style.cursor = '';
    if (ghost) {
      ghost.remove();
      cb.onDrop(e.symbol, u.clientX, u.clientY);
    } else {
      cb.onClick(e.symbol);
    }
  };

  const cancel = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    document.body.style.cursor = '';
    ghost?.remove();
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}
