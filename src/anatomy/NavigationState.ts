/**
 * ATOMICA Multi-Scale Navigation State
 * Tracks the user's focus within a HierarchyTree (zoom in/out, jump, back/forward)
 * and exposes the scale ratio of each transition so the viewport can animate camera zoom.
 * Governed by Task TSK-ENG-002. Pure state — no rendering (ADR-003).
 */

import { HierarchyError, HierarchyTree, type HierarchyNode } from './HierarchyTree';

export type NavigationKind = 'zoom_in' | 'zoom_out' | 'jump' | 'back' | 'forward';

export interface NavigationEvent {
  kind: NavigationKind;
  from: HierarchyNode;
  to: HierarchyNode;
  /**
   * Linear magnification of the transition: from.length / to.length.
   * > 1 when zooming in, < 1 when zooming out, 1 when lateral.
   */
  magnification: number;
}

export type NavigationListener = (event: NavigationEvent) => void;

export class NavigationState {
  private currentId: string;
  private backStack: string[] = [];
  private forwardStack: string[] = [];
  private listeners = new Set<NavigationListener>();

  constructor(private readonly tree: HierarchyTree, startId?: string) {
    const start = startId ? tree.getNode(startId) : tree.getRoot();
    if (!start) throw new HierarchyError('Cannot navigate an empty hierarchy');
    this.currentId = start.id;
  }

  get current(): HierarchyNode {
    return this.tree.getNode(this.currentId);
  }

  /** Root → current, for breadcrumb UI. */
  breadcrumbs(): HierarchyNode[] {
    return this.tree.getPath(this.currentId);
  }

  /** Nodes the user can zoom into from here. */
  zoomTargets(): HierarchyNode[] {
    return this.tree.getChildren(this.currentId);
  }

  canZoomOut(): boolean {
    return this.current.parentId !== null;
  }

  canGoBack(): boolean {
    return this.backStack.length > 0;
  }

  canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  /** Zoom into a direct child. If childId is omitted and there is exactly one child, use it. */
  zoomIn(childId?: string): NavigationEvent {
    const children = this.current.childIds;
    let target = childId;
    if (target === undefined) {
      if (children.length !== 1) {
        throw new HierarchyError(
          `zoomIn() without a target requires exactly one child; ${this.currentId} has ${children.length}`,
        );
      }
      target = children[0];
    }
    if (!children.includes(target)) {
      throw new HierarchyError(`${target} is not a direct child of ${this.currentId}`);
    }
    return this.move(target, 'zoom_in', true);
  }

  zoomOut(): NavigationEvent {
    const parentId = this.current.parentId;
    if (parentId === null) throw new HierarchyError(`${this.currentId} is the root; cannot zoom out`);
    return this.move(parentId, 'zoom_out', true);
  }

  /** Jump to any node in the tree (e.g. search result). */
  jumpTo(id: string): NavigationEvent {
    this.tree.getNode(id); // validates existence
    return this.move(id, 'jump', true);
  }

  back(): NavigationEvent {
    const prev = this.backStack.pop();
    if (prev === undefined) throw new HierarchyError('No navigation history to go back to');
    this.forwardStack.push(this.currentId);
    return this.move(prev, 'back', false);
  }

  forward(): NavigationEvent {
    const next = this.forwardStack.pop();
    if (next === undefined) throw new HierarchyError('No forward history');
    this.backStack.push(this.currentId);
    return this.move(next, 'forward', false);
  }

  subscribe(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private move(targetId: string, kind: NavigationKind, recordHistory: boolean): NavigationEvent {
    const from = this.current;
    const to = this.tree.getNode(targetId);
    if (recordHistory && from.id !== to.id) {
      this.backStack.push(from.id);
      this.forwardStack = [];
    }
    this.currentId = to.id;
    const event: NavigationEvent = {
      kind,
      from,
      to,
      magnification: from.characteristicLengthM / to.characteristicLengthM,
    };
    for (const l of this.listeners) l(event);
    return event;
  }
}
