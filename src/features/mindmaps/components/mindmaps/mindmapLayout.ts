import { MindMapNode } from '@/features/core/types';

export const BRANCH_COLORS = [
  '#ff2a5f', '#0ea5e9', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
];

export const NODE_W = 180;
export const NODE_H = 54;
export const ROOT_W = 210;
export const ROOT_H = 62;
export const H_GAP  = 100;
export const V_GAP  = 20;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function computeLayout(nodes: MindMapNode[]): Map<string, LayoutNode> {
  const layout = new Map<string, LayoutNode>();
  if (!nodes.length) return layout;

  const nMap = new Map<string, MindMapNode>(nodes.map((n) => [n.id, n]));
  const root = nodes.find((n) => n.parent_id === null);
  if (!root) return layout;

  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.id === root.id) continue;
    const pid = n.parent_id ?? root.id;
    if (!childrenOf.has(pid)) childrenOf.set(pid, []);
    childrenOf.get(pid)!.push(n.id);
  }

  function subtreeH(id: string): number {
    const n = nMap.get(id);
    if (!n || n.is_collapsed) return NODE_H;
    const kids = childrenOf.get(id) ?? [];
    if (!kids.length) return NODE_H;
    return Math.max(NODE_H, kids.reduce((s, k) => s + subtreeH(k) + V_GAP, 0) - V_GAP);
  }

  layout.set(root.id, { id: root.id, x: -ROOT_W / 2, y: -ROOT_H / 2, w: ROOT_W, h: ROOT_H });

  const rootKids = childrenOf.get(root.id) ?? [];
  const half = Math.ceil(rootKids.length / 2);
  const rightKids = rootKids.slice(0, half);
  const leftKids  = rootKids.slice(half);

  function place(id: string, startX: number, cY: number, dir: 'right' | 'left') {
    const n = nMap.get(id);
    if (!n) return;
    const nx = dir === 'right' ? startX : startX - NODE_W;
    layout.set(id, { id, x: nx, y: cY - NODE_H / 2, w: NODE_W, h: NODE_H });
    if (n.is_collapsed) return;
    const kids = childrenOf.get(id) ?? [];
    if (!kids.length) return;
    const totalH = kids.reduce((s, k) => s + subtreeH(k) + V_GAP, 0) - V_GAP;
    let curY = cY - totalH / 2;
    const nextX = dir === 'right' ? nx + NODE_W + H_GAP : nx - H_GAP;
    for (const kid of kids) {
      const sh = subtreeH(kid);
      place(kid, nextX, curY + sh / 2, dir);
      curY += sh + V_GAP;
    }
  }

  if (!root.is_collapsed) {
    {
      const totalH = rightKids.reduce((s, k) => s + subtreeH(k) + V_GAP, 0) - V_GAP;
      let curY = -totalH / 2;
      for (const k of rightKids) {
        const sh = subtreeH(k);
        place(k, ROOT_W / 2 + H_GAP, curY + sh / 2, 'right');
        curY += sh + V_GAP;
      }
    }
    {
      const totalH = leftKids.reduce((s, k) => s + subtreeH(k) + V_GAP, 0) - V_GAP;
      let curY = -totalH / 2;
      for (const k of leftKids) {
        const sh = subtreeH(k);
        place(k, -ROOT_W / 2 - H_GAP, curY + sh / 2, 'left');
        curY += sh + V_GAP;
      }
    }
  }

  return layout;
}
