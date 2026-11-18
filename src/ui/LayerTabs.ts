/**
 * Layer tabs (TSK-UI-007): Atomic → Organelle → Cellular → Tissue. Cellular and tissue layers are
 * shown but locked until the organelle layer is finished.
 */
export type Layer = 'atomic' | 'organelle';

const LAYERS: { id: string; label: string; title: string; locked?: boolean }[] = [
  { id: 'atomic', label: 'Atomic', title: 'Atoms & molecules: build structures atom by atom' },
  { id: 'organelle', label: 'Organelle', title: 'Build one organelle from molecules and run its real function' },
  { id: 'cellular', label: 'Cellular', title: 'Coming later: organelles interacting inside a cell', locked: true },
  { id: 'tissue', label: 'Tissue', title: 'Coming later: cells forming tissue', locked: true },
];

export function initLayerTabs(root: HTMLElement, onChange: (layer: Layer) => void): (layer: Layer) => void {
  root.setAttribute('role', 'tablist');
  root.setAttribute('aria-label', 'Simulation layer');
  const buttons = LAYERS.map((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layer-tab';
    b.dataset.layer = l.id;
    b.setAttribute('role', 'tab');
    b.title = l.title;
    b.textContent = l.label;
    if (l.locked) {
      b.disabled = true;
      b.classList.add('locked');
      b.append(Object.assign(document.createElement('span'), { className: 'lock', textContent: ' 🔒' }));
    } else {
      b.addEventListener('click', () => onChange(l.id as Layer));
    }
    root.append(b);
    return b;
  });
  return (layer: Layer) => {
    for (const b of buttons) {
      const on = b.dataset.layer === layer;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    }
  };
}
