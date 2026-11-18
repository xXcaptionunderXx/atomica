/**
 * Clipboard shared by every layer (one per window, TSK-UI-007): Ctrl+C in the atomic layer puts a
 * structure here; Ctrl+V pastes it in the atomic layer, or builds it into the organelle layer.
 */
import type { MoleculeTemplate } from '../sandbox/MoleculeModel';

export interface ClipboardEntry {
  template: MoleculeTemplate;
  pastes: number;
}

let entry: ClipboardEntry | null = null;
const listeners = new Set<() => void>();

export function getClipboard(): ClipboardEntry | null {
  return entry;
}

export function setClipboard(template: MoleculeTemplate): void {
  entry = { template, pastes: 0 };
  for (const fn of listeners) fn();
}

export function onClipboardChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
