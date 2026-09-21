import React, { useMemo } from 'react';
import { MindMapNode } from '@/features/core/types';
import { LayoutNode } from './mindmapLayout';

interface MindMapEdgesProps {
  nodes: MindMapNode[];
  layout: Map<string, LayoutNode>;
  nodeMap: Map<string, MindMapNode>;
  selectedId: string | null;
}

export const MindMapEdges: React.FC<MindMapEdgesProps> = ({
  nodes, layout, nodeMap, selectedId,
}) => {
  const bounds = useMemo(() => {
    let x0 = -600, x1 = 600, y0 = -400, y1 = 400;
    for (const [, l] of layout) {
      x0 = Math.min(x0, l.x - 80); x1 = Math.max(x1, l.x + l.w + 80);
      y0 = Math.min(y0, l.y - 80); y1 = Math.max(y1, l.y + l.h + 80);
    }
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  }, [layout]);

  const paths = useMemo((): JSX.Element[] => {
    const result: JSX.Element[] = [];
    for (const node of nodes) {
      if (!node.parent_id) continue;
      const p  = layout.get(node.parent_id);
      const c  = layout.get(node.id);
      const pn = nodeMap.get(node.parent_id);
      if (!p || !c || pn?.is_collapsed) continue;

      const py  = p.y + p.h / 2;
      const cy2 = c.y + c.h / 2;
      const goRight = (c.x + c.w / 2) >= 0;
      const x0 = goRight ? p.x + p.w : p.x;
      const x1 = goRight ? c.x        : c.x + c.w;
      const mx  = (x0 + x1) / 2;

      const color = node.color || pn?.color || '#0ea5e9';
      const sel   = selectedId === node.id || selectedId === node.parent_id;

      result.push(
        <path
          key={`e-${node.id}`}
          d={`M ${x0} ${py} C ${mx} ${py}, ${mx} ${cy2}, ${x1} ${cy2}`}
          stroke={color}
          strokeOpacity={sel ? 1 : 0.55}
          strokeWidth={sel ? 2.5 : 1.8}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return result;
  }, [nodes, layout, nodeMap, selectedId]);

  return (
    <svg
      style={{
        position: 'absolute',
        left: bounds.x0,
        top: bounds.y0,
        width: bounds.w,
        height: bounds.h,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`${bounds.x0} ${bounds.y0} ${bounds.w} ${bounds.h}`}
    >
      {paths}
    </svg>
  );
};
