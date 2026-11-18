/**
 * Organelle-layer side panel (TSK-UI-007): build checklist (membranes, proteins, cofactors), the
 * organelle's real function (reactions with their blockers, Run/Step), and the surroundings.
 */
import { COMPONENTS } from '../organelle/blueprints';
import type { MoleculeRole } from '../organelle/classify';
import type { OrganelleModel } from '../organelle/OrganelleModel';
import { onClipboardChange } from './clipboard';
import { speciesColor } from './OrganelleView';

export interface OrganellePanelCallbacks {
  /** Build the clipboard structure into the organelle: n copies of each molecule, or 'fill'. */
  paste(copies: number | 'fill'): void;
  /** Describe what the clipboard holds (species names + roles), or null. */
  describeClipboard(): string | null;
  /** Add a library molecule by exact name (slot fillers, surroundings). */
  addLibrary(name: string, copies: number, target: 'auto' | 'pool'): void;
  inspectSpecies(key: string): void;
  inspectOrganelle(): void;
  notify(msg: string): void;
}

export interface OrganellePanelApi {
  showProtein(id: string): void;
  pause(): void;
}

type Child = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}
function button(label: string, title: string, fn: () => void, cls = ''): HTMLButtonElement {
  const b = h('button', { type: 'button', title, class: cls }, label);
  b.addEventListener('click', fn);
  return b;
}

const ROLE_LABEL: Record<MoleculeRole, string> = {
  'bilayer-lipid': 'bilayer lipid',
  sterol: 'sterol',
  'neutral-lipid': 'neutral lipid',
  'single-chain-lipid': 'single-chain lipid',
  molecule: 'molecule',
};

export function initOrganellePanel(root: HTMLElement, model: OrganelleModel, cb: OrganellePanelCallbacks): OrganellePanelApi {
  root.innerHTML = '';
  const head = h('div', { class: 'org-head' });
  const clip = h('div', { class: 'org-clip' });
  const card = h('div', { class: 'org-card' });
  card.hidden = true;
  const build = h('div', { class: 'org-build' });
  const fn = h('div', { class: 'org-function' });
  const surround = h('div', { class: 'org-surround' });
  const actions = h('div', { class: 'org-actions' });
  const note = h(
    'details',
    { class: 'help' },
    h('summary', {}, 'What is real here'),
    h(
      'p',
      { class: 'note' },
      'Organelle names come from the Gene Ontology (3000+ cellular-component terms). Eleven are buildable: their proteins cite real PDB/UniProt entries and their reactions are the real net reactions, element-balanced with PubChem structures. ',
      'Approximations: membranes are coarse-grained (one pasted lipid = one membrane unit; real organelles hold millions), proteins are added as referenced parts because they cannot be built atom by atom in 2D, and reactions fire as discrete turnovers per tick rather than measured kinetics. Shapes are schematic topology, not to scale.',
    ),
  );
  root.append(head, clip, card, build, fn, surround, actions, note);

  // ---------- run loop ----------
  let timer: number | undefined;
  let log: string[] = [];
  const runBtn = button('Run', 'Run the organelle (one tick every 0.4 s)', () => (timer ? pause() : run()), 'primary');
  const stepBtn = button('Step', 'Advance one tick', () => step());
  function step(): void {
    const ev = model.tick();
    if (ev.length) log = [...ev, ...log].slice(0, 6);
  }
  function run(): void {
    if (timer) return;
    timer = window.setInterval(step, 400);
    runBtn.textContent = 'Pause';
  }
  function pause(): void {
    window.clearInterval(timer);
    timer = undefined;
    runBtn.textContent = 'Run';
  }

  // Sequence inputs are built once so typing is not interrupted by re-renders.
  const seqInput = h('input', { type: 'text', class: 'org-seq', spellcheck: 'false' });
  seqInput.addEventListener('keydown', (e) => e.stopPropagation());
  seqInput.addEventListener('change', () => {
    const kind = model.blueprint?.id === 'nucleus' ? 'dna' : 'mrna';
    model.setSequence(kind, seqInput.value);
    log = [];
  });

  let shownProtein: string | null = null;

  function renderClip(): void {
    const d = cb.describeClipboard();
    clip.replaceChildren(
      h('div', { class: 'org-label' }, 'From the Atomic layer'),
      h('div', { class: 'org-clip-what' }, d ?? 'Clipboard empty — select atoms in the Atomic layer and press Ctrl+C'),
      ...(d
        ? [
            h(
              'div',
              { class: 'org-row-btns' },
              button('Paste ×1', 'Build one copy into the organelle (Ctrl+V)', () => cb.paste(1)),
              button('×8', 'Build eight copies', () => cb.paste(8)),
              button('Fill', 'Fill every place in the organelle this molecule fits', () => cb.paste('fill')),
            ),
          ]
        : []),
    );
  }

  function renderCard(): void {
    const id = shownProtein;
    const c = id ? COMPONENTS[id] : null;
    const st = model.status();
    const part = id ? st.parts.find((p) => p.component === id) : undefined;
    if (!c || !part) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    card.replaceChildren(
      h('div', { class: 'org-card-title' }, c.name, button('×', 'Close', () => ((shownProtein = null), renderCard()), 'org-x')),
      h('div', { class: 'meta' }, `${c.ref.db} ${c.ref.id} · ${c.source}`),
      h('div', { class: 'meta' }, c.role),
      h(
        'div',
        { class: 'org-row-btns' },
        h('span', { class: 'meta' }, `${part.have} / ${part.need} present`),
        button('−', 'Remove one', () => model.setProtein(id!, part.have - 1)),
        button('+', 'Add one', () => model.setProtein(id!, part.have + 1)),
      ),
      h('div', { class: 'meta muted' }, 'Proteins are added as referenced structures — they cannot be assembled atom by atom in the 2D sandbox.'),
    );
  }

  function render(): void {
    const st = model.status();
    const bp = st.blueprint;
    const s = model.state;

    // Header
    if (!bp) {
      head.replaceChildren(
        h('h2', {}, 'Organelle'),
        h('p', { class: 'meta' }, 'Choose a buildable organelle from the list on the left, or paste bilayer lipids (Ctrl+V) to start a lipid vesicle. Only one organelle is held at a time.'),
      );
    } else {
      const chip = h('span', { class: `org-chip ${st.complete ? 'ok' : 'warn'}` }, st.complete ? 'Complete' : `Incomplete · ${Math.round(st.progress * 100)}%`);
      head.replaceChildren(
        h('h2', {}, bp.name, ' ', chip),
        h('div', { class: 'meta' }, `${bp.go} · Gene Ontology cellular component`),
        h('div', { class: 'org-progress' }, h('div', { style: `width:${Math.round(st.progress * 100)}%` })),
        h('p', { class: 'meta' }, bp.summary),
      );
      if (!st.complete) {
        head.append(
          h(
            'div',
            { class: 'org-row-btns' },
            button('Complete it', 'Fill everything still missing with the real composition (keeps what you built)', () => model.completeOrganelle(), 'primary'),
            h('span', { class: 'meta' }, 'or keep building it yourself'),
          ),
        );
      }
    }

    // Build checklist
    build.replaceChildren();
    if (bp) {
      if (st.membranes.length) {
        build.append(h('div', { class: 'org-label' }, 'Membranes'));
        for (const m of st.membranes) {
          const counts = new Map<string, number>();
          for (const k of m.members) counts.set(k, (counts.get(k) ?? 0) + 1);
          const chips = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => {
            const chip = h('span', { class: 'org-species', title: `${k} ×${n} — click to inspect atoms; × returns one to the surroundings` }, h('i', { style: `background:${speciesColor(k)}` }), `${k.replace(/ \(.*\)$/, '')} ×${n}`);
            chip.addEventListener('click', (e) => {
              if (!(e.target as Element).closest('.org-x')) cb.inspectSpecies(k);
            });
            chip.append(button('×', 'Remove one (back to the surroundings)', () => model.removeMember('membrane', m.spec.id, k), 'org-x'));
            return chip;
          });
          build.append(
            h(
              'div',
              { class: `org-item ${m.closed ? 'done' : ''}` },
              h('div', { class: 'org-item-head' }, h('b', {}, m.spec.name), h('span', { class: 'meta' }, `${m.spec.kind} · ${m.filled}/${m.spec.units} lipids ${m.closed ? '· closed ✓' : ''}`)),
              h('div', { class: 'org-bar' }, h('div', { style: `width:${Math.min(100, (m.filled / m.spec.units) * 100)}%` })),
              h('div', { class: 'meta' }, `Accepts: ${m.spec.accepts.map((r) => ROLE_LABEL[r] + 's').join(', ')}`),
              ...m.unmet.map((u) => h('div', { class: 'meta red-text' }, `Needs ${u.min} ${u.species} (has ${u.have}) — ${u.why}`)),
              chips.length ? h('div', { class: 'org-chips' }, ...chips) : null,
            ),
          );
        }
      }
      if (st.parts.length) {
        const missing = st.parts.some((p) => p.have < p.need);
        build.append(
          h('div', { class: 'org-label' }, 'Proteins', missing ? button('Add all', 'Add every missing protein part', () => model.addAllProteins(), 'small') : null),
        );
        for (const p of st.parts) {
          const c = COMPONENTS[p.component];
          const row = h(
            'div',
            { class: `org-item compact ${p.have >= p.need ? 'done' : ''}` },
            h('div', { class: 'org-item-head' }, h('span', { class: 'org-link', title: `${c.role}\n${c.source}` }, c.name), h('span', { class: 'meta' }, `${c.ref.db} ${c.ref.id}`)),
            h(
              'div',
              { class: 'org-row-btns' },
              h('span', { class: 'meta' }, `${p.have}/${p.need} · ${p.where === 'lumen' ? 'interior' : 'in membrane'}`),
              button('−', 'Remove one', () => model.setProtein(p.component, p.have - 1)),
              button('+', 'Add one', () => model.setProtein(p.component, p.have + 1)),
            ),
          );
          row.querySelector('.org-link')!.addEventListener('click', () => api.showProtein(p.component));
          build.append(row);
        }
      }
      if (st.slots.length) {
        build.append(h('div', { class: 'org-label' }, 'Cofactors & contents'));
        for (const sl of st.slots) {
          const fill = sl.spec.species?.[0] ?? (sl.spec.role === 'neutral-lipid' ? 'Triolein' : null);
          build.append(
            h(
              'div',
              { class: `org-item compact ${sl.full ? 'done' : ''}` },
              h('div', { class: 'org-item-head' }, h('b', {}, sl.spec.name), h('span', { class: 'meta' }, `${sl.members.length}/${sl.spec.count}`)),
              h('div', { class: 'meta' }, sl.spec.why, sl.spec.species ? ` · ${sl.spec.species.join(' or ')}` : ` · any ${ROLE_LABEL[sl.spec.role!]}`),
              !sl.full && fill
                ? h('div', { class: 'org-row-btns' }, button(`+ ${fill.replace(/ \(.*\)$/, '')}`, 'Add the library molecule (or paste one you built)', () => cb.addLibrary(fill, 1, 'auto')))
                : null,
            ),
          );
        }
      }
    }

    // Function
    fn.replaceChildren();
    if (bp) {
      fn.append(h('div', { class: 'org-label' }, 'Function'));
      const controls = h('div', { class: 'org-row-btns' }, runBtn, stepBtn);
      if (bp.reactions.some((r) => r.light)) {
        const lt = h('label', { class: 'toggle' }, h('input', { type: 'checkbox' }), ' Light');
        const inp = lt.querySelector('input')!;
        inp.checked = s.light;
        inp.addEventListener('change', () => model.setLight(inp.checked));
        controls.append(lt);
      }
      fn.append(controls);
      if (s.ph !== null) {
        fn.append(h('div', { class: 'meta' }, `Lumen pH ${s.ph.toFixed(2)} ${s.ph <= 5.5 ? '(acidic — hydrolases active)' : '(acid hydrolases inactive above 5.5)'}`));
      }
      if (Object.keys(s.lumen).length) {
        fn.append(h('div', { class: 'meta' }, `Interior store: ${Object.entries(s.lumen).map(([k, n]) => `${k} ×${n}`).join(', ')}`));
      }
      const seqKind = bp.id === 'nucleus' ? 'dna' : bp.id === 'ribosome' ? 'mrna' : null;
      if (seqKind) {
        if (document.activeElement !== seqInput) seqInput.value = seqKind === 'dna' ? s.dna : s.mrna;
        seqInput.placeholder = seqKind === 'dna' ? 'DNA coding strand (A C G T)' : 'mRNA (A C G U)';
        fn.append(h('div', { class: 'meta' }, seqKind === 'dna' ? 'DNA coding strand → mRNA' : 'mRNA → polypeptide (standard genetic code)'), seqInput);
        if (seqKind === 'mrna') fn.append(h('div', { class: 'meta' }, `Chain: ${s.peptide ? s.peptide.split('').join('-') : '—'}`));
        if (seqKind === 'dna') {
          fn.append(h('div', { class: 'meta' }, `Transcript: ${s.transcript || '—'}`));
          if (s.outputs.some((o) => o.startsWith('mRNA '))) {
            fn.append(
              h(
                'div',
                { class: 'org-row-btns' },
                button('Send mRNA to ribosome', 'Use the finished mRNA as the ribosome input, then build a ribosome', () => {
                  model.useTranscriptAsMrna();
                  cb.notify('mRNA exported — choose the Ribosome to translate it');
                }),
              ),
            );
          }
        }
      }
      for (const rs of st.reactions) {
        const r = rs.reaction;
        const eq =
          r.kind === 'translation'
            ? 'amino acid + ATP + 2 GTP + 2 H₂O → +1 residue + AMP + PPᵢ + 2 GDP + 2 Pᵢ'
            : r.kind === 'transcription'
              ? 'NTP + RNA(n) → RNA(n+1) + PPᵢ'
              : `${r.reactants.map(([sp, n]) => `${n > 1 ? n + ' ' : ''}${sp.replace(/^lumen:/, '[in] ')}`).join(' + ')} → ${r.products.map(([sp, n]) => `${n > 1 ? n + ' ' : ''}${sp.replace(/^lumen:/, '[in] ')}`).join(' + ')}`;
        const state = rs.ready ? 'ready' : rs.blockers.length ? 'blocked' : 'starved';
        fn.append(
          h(
            'div',
            { class: `org-rxn ${state}` },
            h('div', { class: 'org-item-head' }, h('b', {}, r.name), h('span', { class: 'meta' }, `${s.turnovers[r.id] ?? 0} turnovers`)),
            h('div', { class: 'org-eq' }, eq),
            ...rs.blockers.slice(0, 4).map((b) => h('div', { class: 'meta red-text' }, b)),
            rs.blockers.length > 4 ? h('div', { class: 'meta red-text' }, `…and ${rs.blockers.length - 4} more`) : null,
            !rs.blockers.length && rs.short.length ? h('div', { class: 'meta warn-text' }, `Waiting for substrate: ${rs.short.join(', ')}`) : null,
            h('div', { class: 'meta muted' }, r.note),
          ),
        );
      }
      if (!st.reactions.length) fn.append(h('div', { class: 'meta' }, 'A closed bilayer compartment: no enzymes, so no reactions. It separates inside from outside (small nonpolar molecules such as O₂ and CO₂ cross; ions and sugars do not).'));
      if (s.outputs.length) fn.append(h('div', { class: 'meta' }, `Products: ${s.outputs.slice(-3).join(' · ')}`));
      for (const l of log) fn.append(h('div', { class: 'meta ok-text' }, l));
    }

    // Surroundings
    const pools = Object.entries(s.pools).sort((a, b) => a[0].localeCompare(b[0]));
    surround.replaceChildren(
      h('div', { class: 'org-label' }, 'Surroundings', bp && Object.keys(bp.feed).length ? button('Stock', 'Add the substrates this organelle uses', () => model.stockSurroundings(), 'small') : null),
    );
    if (!pools.length) surround.append(h('div', { class: 'meta' }, 'No free molecules. Add them from the Molecules category on the left, or paste.'));
    for (const [k, n] of pools) {
      const role = model.roleOf(k) ?? 'molecule';
      const room = bp ? model.roomFor(k, role) : 0;
      const name = h('span', { class: 'org-species plain', title: `${k} — ${ROLE_LABEL[role]} · click to inspect atoms` }, h('i', { style: `background:${speciesColor(k)}` }), k);
      name.addEventListener('click', () => cb.inspectSpecies(k));
      surround.append(
        h(
          'div',
          { class: 'org-pool' },
          name,
          h(
            'span',
            { class: 'org-row-btns' },
            h('span', { class: 'meta' }, `×${n}`),
            button('−', 'Remove one', () => model.adjustPool(k, -1)),
            button('+', 'Add one', () => model.adjustPool(k, 1)),
            room > 0 ? button('Build in', `Move up to ${Math.min(room, n)} into the organelle`, () => model.incorporate(k), 'small') : null,
          ),
        ),
      );
    }

    actions.replaceChildren(
      button('Inspect atoms', 'Open the molecules this organelle is built from in the Atomic layer', () => cb.inspectOrganelle(), 'primary'),
      button('Clear organelle', 'Remove the organelle (Ctrl+Z to undo)', () => {
        pause();
        model.clear(false);
      }),
    );
    if (!bp) pause();
    renderCard();
  }

  const api: OrganellePanelApi = {
    showProtein(id: string) {
      shownProtein = id;
      renderCard();
      card.scrollIntoView({ block: 'nearest' });
    },
    pause,
  };

  model.subscribe(render);
  onClipboardChange(renderClip);
  renderClip();
  render();
  return api;
}
