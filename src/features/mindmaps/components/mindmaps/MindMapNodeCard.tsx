import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MindMapNode } from '@/features/core/types';
import { LayoutNode } from './mindmapLayout';

interface MindMapNodeCardProps {
  node: MindMapNode;
  pos: LayoutNode;
  isSelected: boolean;
  isEditing: boolean;
  editText: string;
  color: string;
  hasKids: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onEditChange: (text: string) => void;
  onEditFinish: () => void;
  onEditCancel: () => void;
  onToggleCollapse: () => void;
}

export const MindMapNodeCard: React.FC<MindMapNodeCardProps> = ({
  node, pos, isSelected, isEditing, editText, color, hasKids,
  onSelect, onDoubleClick, onEditChange, onEditFinish, onEditCancel, onToggleCollapse,
}) => {
  const isRoot = node.parent_id === null;

  return (
    <div
      className={`mindmap-node-card${isSelected ? ' selected' : ''}${isRoot ? ' root-node' : ''}`}
      style={{
        position: 'absolute',
        left: pos.x, top: pos.y, width: pos.w, minHeight: pos.h,
        borderColor: isSelected ? color : undefined,
        boxShadow: isSelected ? `0 0 0 2px ${color}55, 0 6px 20px rgba(0,0,0,0.28)` : undefined,
        pointerEvents: 'auto',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
    >
      {/* Barra colorida lateral */}
      <div style={{
        position: 'absolute', left: 0, top: '15%', bottom: '15%',
        width: 3, borderRadius: '0 3px 3px 0', background: color,
      }} />

      <div className="mindmap-node-header">
        <div className="mindmap-node-text-row">
          {node.icon && <span className="mindmap-node-icon">{node.icon}</span>}

          {isEditing ? (
            <input
              type="text"
              className="mindmap-node-input"
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditFinish}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditFinish();
                if (e.key === 'Escape') onEditCancel();
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="mindmap-node-label">{node.text}</span>
          )}
        </div>

        {hasKids && !isEditing && (
          <button
            className="mindmap-node-collapse-btn"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            title={node.is_collapsed ? 'Expandir' : 'Recolher'}
            aria-label={node.is_collapsed ? 'Expandir' : 'Recolher'}
          >
            {node.is_collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

    </div>
  );
};
