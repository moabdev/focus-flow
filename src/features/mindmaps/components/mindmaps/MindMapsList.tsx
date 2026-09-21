import React, { useState } from 'react';
import { Plus, Trash2, Network } from 'lucide-react';
import { MindMap, Project } from '@/features/core/types';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';

interface MindMapsListProps {
  filteredMaps: MindMap[];
  projects: Project[];
  searchQuery: string;
  onOpenCreateModal: () => void;
  onSetActiveMapId: (id: string) => void;
  onDeleteMap: (id: string) => void;
}

export const MindMapsList: React.FC<MindMapsListProps> = ({
  filteredMaps,
  projects,
  searchQuery,
  onOpenCreateModal,
  onSetActiveMapId,
  onDeleteMap,
}) => {
  const [mapToDelete, setMapToDelete] = useState<MindMap | null>(null);

  if (filteredMaps.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗺️</div>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Nenhum mapa mental encontrado</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 1.25rem 0' }}>
          {searchQuery
            ? 'Tente outros termos de busca.'
            : 'Crie seu primeiro mapa mental para visualizar ideias de forma estruturada!'}
        </p>
        <button className="btn-study-deck" style={{ width: 'auto', margin: '0 auto' }} onClick={onOpenCreateModal}>
          <Plus size={16} /> Criar Mapa Mental
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredMaps.map((map) => {
          const project = projects.find((p) => p.id === map.project_id);
          const rootNode = map.nodes.find((n) => n.parent_id === null);

          return (
            <div
              key={map.id}
              className="deck-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                gap: '1.5rem',
                flexDirection: 'row',
              }}
              onClick={() => onSetActiveMapId(map.id)}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="deck-emoji-icon" style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                    {rootNode?.icon || '🧠'}
                  </span>
                  <h3 className="deck-card-title" style={{ margin: 0 }}>{map.title}</h3>
                </div>

                {map.description && (
                  <p className="deck-card-desc" style={{ margin: 0, paddingLeft: '2.25rem' }}>
                    {map.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingLeft: '2.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {project && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {project.icon || '📁'} {project.title}
                    </span>
                  )}
                  <span>Modificado em {new Date(map.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-study-deck"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetActiveMapId(map.id);
                  }}
                  title="Abrir Editor de Mapa Mental"
                >
                  <Network size={16} /> Abrir Editor
                </button>

                <button
                  className="btn-deck-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapToDelete(map);
                  }}
                  title="Excluir Mapa"
                  aria-label="Excluir Mapa"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={!!mapToDelete}
        title="Excluir Mapa Mental"
        message={
          <>
            Tem certeza que deseja excluir o mapa mental <strong>"{mapToDelete?.title}"</strong> e todos os seus tópicos? Esta ação não pode ser desfeita.
          </>
        }
        confirmText="Excluir Mapa"
        onConfirm={() => {
          if (mapToDelete) {
            onDeleteMap(mapToDelete.id);
            setMapToDelete(null);
          }
        }}
        onCancel={() => setMapToDelete(null)}
      />
    </>
  );
};
