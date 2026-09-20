import React, { useState, useMemo } from 'react';
import { GitFork, Plus, Search, Trash2, ArrowLeft, Network, Calendar, BookOpen } from 'lucide-react';
import { MindMap, Project } from '../../types';
import { useMindMaps } from '../../hooks/useMindMaps';
import { MindMapCanvas } from './MindMapCanvas';
import { MindMapTemplate } from '../../services/storageMindMaps';

interface MindMapsViewProps {
  projects: Project[];
  onOpenTimerTab?: () => void;
}

const TEMPLATE_OPTIONS: { id: MindMapTemplate; label: string; emoji: string; desc: string }[] = [
  {
    id: 'blank',
    label: 'Mapa em Branco',
    emoji: '🧠',
    desc: 'Começa do zero com apenas a ideia central.',
  },
  {
    id: 'study_summary',
    label: 'Resumo de Estudo',
    emoji: '📖',
    desc: 'Conceitos, exemplos e pontos de atenção pré-configurados.',
  },
  {
    id: 'project_breakdown',
    label: 'Breakdown de Projeto',
    emoji: '🚀',
    desc: 'Objetivos, etapas de execução e riscos estruturados.',
  },
];

export const MindMapsView: React.FC<MindMapsViewProps> = ({ projects }) => {
  const {
    maps,
    activeMapId,
    activeMap,
    selectedNodeId,
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

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<MindMapTemplate>('blank');

  const filteredMaps = useMemo(() => {
    return maps.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [maps, searchQuery]);

  const handleCreateMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMap(newTitle.trim(), newDesc.trim(), newProjectId, selectedTemplate);
    setNewTitle('');
    setNewDesc('');
    setNewProjectId(undefined);
    setSelectedTemplate('blank');
    closeCreateModal();
  };

  // Se há um mapa ativo, mostra o editor de canvas
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

  // Lista de Mapas (Hub)
  return (
    <div className="flashcards-container">
      {/* Header */}
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

      {/* Stats Banner */}
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

      {/* Barra de Busca */}
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

      {/* Grid de Mapas */}
      {filteredMaps.length === 0 ? (
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
          <button className="btn-study-deck" style={{ width: 'auto', margin: '0 auto' }} onClick={openCreateModal}>
            <Plus size={16} /> Criar Mapa Mental
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredMaps.map((map) => {
            const project = projects.find((p) => p.id === map.project_id);
            const rootNode = map.nodes.find((n) => n.parent_id === null);
            const rootChildren = map.nodes.filter((n) => n.parent_id === map.root_node_id);

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
                  flexDirection: 'row'
                }}
                onClick={() => setActiveMapId(map.id)}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="deck-emoji-icon" style={{ fontSize: '1.5rem', flexShrink: 0 }}>{rootNode?.icon || '🧠'}</span>
                    <h3 className="deck-card-title" style={{ margin: 0 }}>{map.title}</h3>
                  </div>

                  {map.description && (
                    <p className="deck-card-desc" style={{ margin: 0, paddingLeft: '2.25rem' }}>
                      {map.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '2.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {project && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {project.icon || '📁'} {project.title}
                      </span>
                    )}
                    <span>
                      Modificado em {new Date(map.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                  <button
                    className="btn-study-deck"
                    onClick={(e) => { e.stopPropagation(); setActiveMapId(map.id); }}
                    title="Abrir Editor de Mapa Mental"
                  >
                    <Network size={16} /> Abrir Editor
                  </button>

                  <button
                    className="btn-deck-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Excluir o mapa "${map.title}"?`)) {
                        deleteMap(map.id);
                      }
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
      )}

      {/* Modal de Criação */}
      {isCreateModalOpen && (
        <div className="study-modal-overlay" onClick={closeCreateModal}>
          <div className="study-modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="study-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Novo Mapa Mental
              </h2>
              <button className="btn-deck-icon" onClick={closeCreateModal} aria-label="Fechar">
                <span style={{ fontSize: '1.25rem' }}>✕</span>
              </button>
            </div>

            <form onSubmit={handleCreateMap} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Título do Mapa *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Redes de Computadores, Farmacologia Clínica, Sistema Solar..."
                  required
                  autoFocus
                  className="mindmap-node-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Descrição (Opcional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Contexto, objetivo ou foco deste mapa..."
                  rows={2}
                  className="mindmap-node-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Escolha um Template
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {TEMPLATE_OPTIONS.map((t) => (
                    <label
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${selectedTemplate === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        background: selectedTemplate === t.id ? 'rgba(255,42,95,0.06)' : 'var(--bg-primary)',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={t.id}
                        checked={selectedTemplate === t.id}
                        onChange={() => setSelectedTemplate(t.id)}
                        style={{ marginTop: '2px' }}
                      />
                      <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {t.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {projects.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Vincular a Projeto (Opcional)
                  </label>
                  <select
                    value={newProjectId || ''}
                    onChange={(e) => setNewProjectId(e.target.value || undefined)}
                    className="flashcards-filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Sem vínculo</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon || '📁'} {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn-deck-icon" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-study-deck" style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
                  <Plus size={16} /> Criar Mapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
