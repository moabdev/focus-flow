import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Plus, Minus, Maximize2, RotateCcw, PanelRight, X } from 'lucide-react';
import { MindMap, MindMapNode } from '../../types';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';
import { MindMapEdges } from './MindMapEdges';
import { MindMapNodeCard } from './MindMapNodeCard';
import { computeLayout, BRANCH_COLORS } from './mindmapLayout';

interface MindMapCanvasProps {
  map: MindMap;
  onAddNode: (parentId: string, text?: string, color?: string, notes?: string) => MindMapNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<MindMapNode>) => MindMapNode | null;
  onDeleteNode: (nodeId: string) => boolean;
  onToggleCollapse: (nodeId: string) => boolean;
  onUpdateMap: (id: string, updates: Partial<MindMap>) => void;
  onBack: () => void;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  map, onAddNode, onUpdateNode, onDeleteNode, onToggleCollapse, onUpdateMap, onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [scale, setScale] = useState(0.85);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pan = useRef({ on: false, sx: 0, sy: 0, stx: 0, sty: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(map.root_node_id);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editText,   setEditText]   = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapTitle,   setMapTitle]   = useState(map.title);
  const [editTitle,  setEditTitle]  = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setScale(0.85); setTx(0); setTy(0);
    setSelectedId(map.root_node_id); setEditingId(null);
    setDrawerOpen(false); setMapTitle(map.title);
  }, [map.id, map.root_node_id, map.title]);

  const layout  = useMemo(() => computeLayout(map.nodes), [map.nodes]);
  const nodeMap = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const cx = size.w / 2;
  const cy = size.h / 2;

  const onMD = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.mindmap-node-card')) return;
    pan.current = { on: true, sx: e.clientX, sy: e.clientY, stx: tx, sty: ty };
  }, [tx, ty]);

  const onMM = useCallback((e: React.MouseEvent) => {
    if (!pan.current.on) return;
    setTx(pan.current.stx + e.clientX - pan.current.sx);
    setTy(pan.current.sty + e.clientY - pan.current.sy);
  }, []);

  const onMU = useCallback(() => { pan.current.on = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const r = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setScale((prev) => {
      const next = Math.min(3, Math.max(0.15, prev * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
      setTx((ptx) => mx - cx - ((mx - cx - ptx) / prev) * next);
      setTy((pty) => my - cy - ((my - cy - pty) / prev) * next);
      return next;
    });
  }, [cx, cy]);

  const getColor = useCallback((id: string): string => {
    let cur: string | null = id;
    while (cur) { const n = nodeMap.get(cur); if (!n) break; if (n.color) return n.color; cur = n.parent_id; }
    return '#0ea5e9';
  }, [nodeMap]);

  const finishEdit = useCallback(() => {
    if (editingId && editText.trim()) onUpdateNode(editingId, { text: editText.trim() });
    setEditingId(null); setEditText('');
  }, [editingId, editText, onUpdateNode]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingId !== null || !selectedId) return;
      const sel = nodeMap.get(selectedId);
      if (!sel) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        const ci = map.nodes.findIndex((n) => n.id === selectedId) % BRANCH_COLORS.length;
        const nn = onAddNode(selectedId, 'Novo Tópico', sel.color || BRANCH_COLORS[ci]);
        if (nn) { setSelectedId(nn.id); setTimeout(() => { setEditingId(nn.id); setEditText('Novo Tópico'); }, 50); }
      } else if (e.key === 'Enter' && sel.parent_id) {
        e.preventDefault();
        const nn = onAddNode(sel.parent_id, 'Novo Tópico', sel.color);
        if (nn) { setSelectedId(nn.id); setTimeout(() => { setEditingId(nn.id); setEditText('Novo Tópico'); }, 50); }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.parent_id) {
        e.preventDefault(); onDeleteNode(selectedId); setSelectedId(sel.parent_id);
      } else if (e.key === 'F2') {
        e.preventDefault(); setEditingId(selectedId); setEditText(sel.text);
      } else if (e.key === 'Escape') {
        setSelectedId(null); setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedId, editingId, map.nodes, nodeMap, onAddNode, onDeleteNode]);

  const selNode = selectedId ? (nodeMap.get(selectedId) ?? null) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.5rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', gap: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <button onClick={onBack} className="btn-deck-icon" title="Voltar" aria-label="Voltar"><X size={18} /></button>
          {editTitle ? (
            <input type="text" value={mapTitle} onChange={(e) => setMapTitle(e.target.value)}
              onBlur={() => { setEditTitle(false); if (mapTitle.trim() && mapTitle !== map.title) onUpdateMap(map.id, { title: mapTitle.trim() }); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setEditTitle(false); if (mapTitle.trim()) onUpdateMap(map.id, { title: mapTitle.trim() }); } if (e.key === 'Escape') { setEditTitle(false); setMapTitle(map.title); } }}
              autoFocus className="mindmap-node-input" style={{ fontSize: '1rem', fontWeight: 700 }} />
          ) : (
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setEditTitle(true)} title="Clique para renomear">{map.title}</h2>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
          <div className="mindmap-shortcuts-legend" style={{ position: 'static', border: 'none', background: 'transparent' }}>
            <span><kbd>Tab</kbd> Filho</span>
            <span><kbd>Enter</kbd> Irmão</span>
            <span><kbd>Del</kbd> Excluir</span>
            <span><kbd>F2</kbd> Editar</span>
          </div>
          <button className="btn-deck-icon" onClick={() => setDrawerOpen((p) => !p)} title="Anotações" aria-label="Anotações"
            style={drawerOpen ? { background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' } : {}}>
            <PanelRight size={18} />
          </button>
        </div>
      </div>

      {/* Canvas + Drawer */}
      <div style={{ display: 'flex', flex: 1, gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}>
        <div ref={containerRef} className="mindmap-canvas-container"
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWheel}>

          <div style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--overlay-active)', color: 'var(--text-secondary)', fontSize: '0.68rem', padding: '0.2rem 0.65rem', borderRadius: '999px', pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap' }}>
            Arraste para mover · Scroll para zoom · Duplo-clique para editar
          </div>

          <div className="mindmap-floating-toolbar">
            <button className="mindmap-toolbar-btn" onClick={() => setScale((s) => Math.min(3, s * 1.15))} title="Zoom +" aria-label="Zoom +"><Plus size={15} /></button>
            <span className="mindmap-zoom-label">{Math.round(scale * 100)}%</span>
            <button className="mindmap-toolbar-btn" onClick={() => setScale((s) => Math.max(0.15, s * 0.87))} title="Zoom -" aria-label="Zoom -"><Minus size={15} /></button>
            <div className="mindmap-toolbar-divider" />
            <button className="mindmap-toolbar-btn" onClick={() => { setScale(1); setTx(0); setTy(0); }} title="Reset" aria-label="Reset"><RotateCcw size={15} /></button>
            <button className="mindmap-toolbar-btn" onClick={() => { setScale(0.65); setTx(0); setTy(0); }} title="Visão geral" aria-label="Visão geral"><Maximize2 size={15} /></button>
          </div>

          {/* Viewport: translate(cx+tx, cy+ty) coloca origem do mundo no centro; scale(scale) é o zoom */}
          <div style={{ position: 'absolute', left: `${cx + tx}px`, top: `${cy + ty}px`, transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
            <MindMapEdges nodes={map.nodes} layout={layout} nodeMap={nodeMap} selectedId={selectedId} />

            {map.nodes.map((node) => {
              const pos = layout.get(node.id);
              if (!pos) return null;
              return (
                <MindMapNodeCard
                  key={node.id}
                  node={node}
                  pos={pos}
                  isSelected={selectedId === node.id}
                  isEditing={editingId === node.id}
                  editText={editText}
                  color={getColor(node.id)}
                  hasKids={map.nodes.some((n) => n.parent_id === node.id)}
                  onSelect={() => setSelectedId(node.id)}
                  onDoubleClick={() => { setEditingId(node.id); setEditText(node.text); }}
                  onEditChange={setEditText}
                  onEditFinish={finishEdit}
                  onEditCancel={() => { setEditingId(null); setEditText(''); }}
                  onToggleCollapse={() => onToggleCollapse(node.id)}
                />
              );
            })}
          </div>
        </div>

        {drawerOpen && selNode && (
          <NodeDetailsDrawer
            node={selNode}
            nodeColor={getColor(selNode.id)}
            onUpdateNode={(u) => { if (selectedId) onUpdateNode(selectedId, u); }}
            onDeleteNode={() => {
              if (selectedId && selNode.parent_id) {
                onDeleteNode(selectedId); setSelectedId(selNode.parent_id);
                if (nodeMap.size <= 1) setDrawerOpen(false);
              }
            }}
            onAddChild={(t) => {
              if (selectedId) { const n = onAddNode(selectedId, t, selNode.color); if (n) setSelectedId(n.id); }
            }}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
