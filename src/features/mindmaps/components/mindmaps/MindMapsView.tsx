import React, { useMemo } from 'react';
import { GitFork, Plus, Search, Network } from 'lucide-react';
import { Project } from '@/features/core/types';
import { useMindMaps } from '@/features/mindmaps/hooks/useMindMaps';
import { MindMapCanvas } from './MindMapCanvas';
import { MindMapCreateModal } from './MindMapCreateModal';
import { MindMapsList } from './MindMapsList';

interface MindMapsViewProps {
  projects: Project[];
  onOpenTimerTab?: () => void;
}

export const MindMapsView: React.FC<MindMapsViewProps> = ({ projects }) => {
  const {
    maps,
    activeMapId,
    activeMap,
    setActiveMapId,
    setSelectedNodeId,
    isCreateModalOpen,
    searchQuery,
    setSearchQuery,
    openCreateModal,
    closeCreateModal,
    createMap,
    updateMap,
    deleteMap,
    addNode,
    updateNode,
    deleteNode,
    toggleCollapse,
  } = useMindMaps();

  const filteredMaps = useMemo(() => {
    return maps.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [maps, searchQuery]);

  if (activeMapId && activeMap) {
    return (
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <MindMapCanvas
          map={activeMap}
          onAddNode={(parentId, text, color, notes) => addNode(parentId, text, color, notes)}
          onUpdateNode={(nodeId, updates) => updateNode(nodeId, updates)}
          onDeleteNode={(nodeId) => deleteNode(nodeId)}
          onToggleCollapse={(nodeId) => toggleCollapse(nodeId)}
          onUpdateMap={(id, updates) => updateMap(id, updates)}
          onBack={() => {
            setActiveMapId(null);
            setSelectedNodeId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flashcards-container">
      <div className="flashcards-header">
        <div className="flashcards-title-wrap">
          <h1>
            <GitFork size={26} style={{ color: 'var(--accent-primary)' }} />
            Mapas Mentais Interativos
          </h1>
          <p>
            Organize e conecte ideias em canvas vetoriais infinitos com hierarquia inteligente e anotações ricas.
          </p>
        </div>

        <button className="btn-study-deck" style={{ width: 'auto' }} onClick={openCreateModal}>
          <Plus size={18} /> Novo Mapa
        </button>
      </div>

      <div className="flashcards-stats-banner">
        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Network size={22} />
          </div>
          <div className="flashcard-stat-info">
            <span className="flashcard-stat-val">{maps.length}</span>
            <span className="flashcard-stat-label">Mapas Criados</span>
          </div>
        </div>
      </div>

      <div className="flashcards-toolbar">
        <div className="flashcards-search-box">
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <MindMapsList
        filteredMaps={filteredMaps}
        projects={projects}
        searchQuery={searchQuery}
        onOpenCreateModal={openCreateModal}
        onSetActiveMapId={setActiveMapId}
        onDeleteMap={deleteMap}
      />

      <MindMapCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projects={projects}
        onCreateMap={createMap}
      />
    </div>
  );
};
