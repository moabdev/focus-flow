import React, { useState } from 'react';
import { X, Trash2, Plus, Palette } from 'lucide-react';
import { MindMapNode } from '@/features/core/types';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';

interface NodeDetailsDrawerProps {
  node: MindMapNode;
  nodeColor: string;
  onUpdateNode: (updates: Partial<MindMapNode>) => void;
  onDeleteNode: () => void;
  onAddChild: (text: string) => void;
  onClose: () => void;
}

const NODE_COLORS = [
  '#ff2a5f', '#0ea5e9', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
];

const NODE_ICONS = ['💡', '📌', '⚠️', '✅', '🔬', '📖', '🎯', '🚀', '💬', '🔗'];

export const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({
  node,
  nodeColor,
  onUpdateNode,
  onDeleteNode,
  onAddChild,
  onClose,
}) => {
  const [newChildText, setNewChildText] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildText.trim()) return;
    onAddChild(newChildText.trim());
    setNewChildText('');
  };

  return (
    <>
      <div className="node-drawer-overlay">
        {/* Header */}
        <div className="node-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: nodeColor,
                flexShrink: 0,
              }}
            />
            <span className="node-drawer-title" style={{ wordBreak: 'break-word' }}>
              {node.text}
            </span>
          </div>

          <button className="btn-deck-icon" onClick={onClose} aria-label="Fechar painel">
            <X size={16} />
          </button>
        </div>

        {/* Cor do Nó */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Palette size={12} /> Cor do Ramo
          </div>
          <div className="node-drawer-colors-row">
            {NODE_COLORS.map((c) => (
              <button
                key={c}
                className={`node-color-swatch ${node.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => onUpdateNode({ color: c })}
                title={c}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Ícone do Nó */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Ícone / Emoji
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                border: !node.icon ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={() => onUpdateNode({ icon: undefined })}
            >
              Nenhum
            </button>

            {NODE_ICONS.map((ic) => (
              <button
                key={ic}
                style={{
                  fontSize: '1rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '6px',
                  border: node.icon === ic ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
                onClick={() => onUpdateNode({ icon: ic })}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Adicionar Filho Rápido */}
        <form onSubmit={handleAddChild} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newChildText}
            onChange={(e) => setNewChildText(e.target.value)}
            placeholder="Adicionar sub-tópico..."
            className="mindmap-node-input"
            style={{ flex: 1, padding: '0.4rem 0.65rem' }}
          />
          <button type="submit" className="btn-deck-icon" title="Adicionar filho" aria-label="Adicionar filho">
            <Plus size={16} />
          </button>
        </form>

        {/* Excluir Nó */}
        {node.parent_id && (
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} /> Excluir Nó e Descendentes
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Excluir Tópico"
        message={
          <>
            Tem certeza que deseja excluir <strong>"{node.text}"</strong> e todos os seus sub-tópicos? Esta ação não pode ser desfeita.
          </>
        }
        confirmText="Excluir Tópico"
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          onDeleteNode();
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
};
