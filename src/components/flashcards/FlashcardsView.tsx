import React, { useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Flame,
  CheckCircle,
  Clock,
  Play,
  Settings2,
  Trash2,
  Filter,
} from 'lucide-react';
import { Project, FlashcardDeck } from '../../types';
import { useFlashcards } from '../../hooks/useFlashcards';
import { FlashcardStudyModal } from './FlashcardStudyModal';
import { DeckManagerModal } from './DeckManagerModal';

interface FlashcardsViewProps {
  projects: Project[];
  onOpenTimerTab?: () => void;
  onSelectProjectForStudy?: (projectId: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  projects,
  onOpenTimerTab,
}) => {
  const {
    decks,
    cards,
    activeDeck,
    activeDeckCards,
    dueCardsCount,
    totalCardsCount,
    isStudyModalOpen,
    isDeckModalOpen,
    editingDeck,
    searchQuery,
    setSearchQuery,
    selectedProjectId,
    setSelectedProjectId,
    openStudyModal,
    closeStudyModal,
    openCreateDeckModal,
    openEditDeckModal,
    closeDeckModal,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    updateCard,
    deleteCard,
    recordReview,
    importCards,
    exportDeck,
  } = useFlashcards();

  // Filtragem dos baralhos por busca e projeto
  const filteredDecks = useMemo(() => {
    return decks.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesProject =
        selectedProjectId === 'all' || d.project_id === selectedProjectId;

      return matchesSearch && matchesProject;
    });
  }, [decks, searchQuery, selectedProjectId]);

  const handleStartPomodoroForDeck = (deck: FlashcardDeck) => {
    if (onOpenTimerTab) {
      onOpenTimerTab();
    }
  };

  return (
    <div className="flashcards-container">
      {/* Header Principal */}
      <div className="flashcards-header">
        <div className="flashcards-title-wrap">
          <h1>
            <Layers size={26} style={{ color: 'var(--accent-primary)' }} />
            Flashcards & Repetição Espaçada
          </h1>
          <p>
            Otimize sua retenção de longo prazo com o algoritmo SM-2 (SuperMemo) integrado ao seu foco diário.
          </p>
        </div>

        <button className="btn-study-deck" style={{ width: 'auto' }} onClick={openCreateDeckModal}>
          <Plus size={18} /> Novo Baralho
        </button>
      </div>

      {/* Banner de Métricas Rápidas */}
      <div className="flashcards-stats-banner">
        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon stat-icon-due">
            <Clock size={22} />
          </div>
          <div className="flashcard-stat-info">
            <span className="flashcard-stat-val">{dueCardsCount}</span>
            <span className="flashcard-stat-label">Para Revisar Hoje</span>
          </div>
        </div>

        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon stat-icon-total">
            <BookOpen size={22} />
          </div>
          <div className="flashcard-stat-info">
            <span className="flashcard-stat-val">{totalCardsCount}</span>
            <span className="flashcard-stat-label">Total de Cartões</span>
          </div>
        </div>

        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon stat-icon-decks">
            <Layers size={22} />
          </div>
          <div className="flashcard-stat-info">
            <span className="flashcard-stat-val">{decks.length}</span>
            <span className="flashcard-stat-label">Baralhos Criados</span>
          </div>
        </div>

        <div className="flashcard-stat-card">
          <div className="flashcard-stat-icon stat-icon-streak">
            <Flame size={22} />
          </div>
          <div className="flashcard-stat-info">
            <span className="flashcard-stat-val">SM-2</span>
            <span className="flashcard-stat-label">Algoritmo Ativo</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtro de Projetos */}
      <div className="flashcards-toolbar">
        <div className="flashcards-search-box">
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Buscar por título, descrição ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flashcards-filter-select"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Baralhos */}
      {filteredDecks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Nenhum baralho encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 1.25rem 0' }}>
            {searchQuery || selectedProjectId !== 'all'
              ? 'Tente ajustar os termos de busca ou filtros.'
              : 'Crie seu primeiro baralho de flashcards para iniciar seus estudos ativos!'}
          </p>
          <button className="btn-study-deck" style={{ width: 'auto', margin: '0 auto' }} onClick={openCreateDeckModal}>
            <Plus size={16} /> Criar Novo Baralho
          </button>
        </div>
      ) : (
        <div className="decks-grid">
          {filteredDecks.map((deck) => {
            const hasDue = (deck.due_count || 0) > 0;
            const project = projects.find((p) => p.id === deck.project_id);

            return (
              <div key={deck.id} className="deck-card">
                <div className="deck-card-top-bar" style={{ background: deck.color }} />

                <div className="deck-card-body">
                  <div className="deck-card-header">
                    <div className="deck-avatar-title">
                      <span className="deck-emoji-icon">{deck.icon}</span>
                      <div>
                        <h3 className="deck-card-title">{deck.title}</h3>
                        {project && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {project.icon || '📁'} {project.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {hasDue ? (
                      <span className="deck-due-badge">
                        {deck.due_count} {deck.due_count === 1 ? 'pendente' : 'pendentes'}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#10b981',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <CheckCircle size={13} /> Em dia
                      </span>
                    )}
                  </div>

                  {deck.description && <p className="deck-card-desc">{deck.description}</p>}

                  {deck.tags && deck.tags.length > 0 && (
                    <div className="deck-tags-row">
                      {deck.tags.map((t, i) => (
                        <span key={i} className="deck-tag-pill">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="deck-card-meta">
                    <span>
                      <strong>{deck.card_count || 0}</strong> {deck.card_count === 1 ? 'cartão' : 'cartões'}
                    </span>
                    <span>Revisão SM-2</span>
                  </div>
                </div>

                <div className="deck-card-actions">
                  <button
                    className="btn-study-deck"
                    onClick={() => openStudyModal(deck.id)}
                    title="Iniciar Sessão de Estudo"
                  >
                    <Play size={16} /> Estudar Agora
                  </button>

                  <button
                    className="btn-deck-icon"
                    onClick={() => openEditDeckModal(deck)}
                    title="Gerenciar / Adicionar Cartões"
                    aria-label="Gerenciar Baralho"
                  >
                    <Settings2 size={16} />
                  </button>

                  <button
                    className="btn-deck-icon"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir o baralho "${deck.title}" e todos os seus cartões?`)) {
                        deleteDeck(deck.id);
                      }
                    }}
                    title="Excluir Baralho"
                    aria-label="Excluir Baralho"
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

      {/* Modal de Estudo (Flip Card 3D) */}
      {isStudyModalOpen && activeDeck && (
        <FlashcardStudyModal
          deck={activeDeck}
          cards={activeDeckCards}
          isOpen={isStudyModalOpen}
          onClose={closeStudyModal}
          onRecordReview={recordReview}
          onStartPomodoroForDeck={handleStartPomodoroForDeck}
        />
      )}

      {/* Modal de Gerenciamento do Baralho */}
      {isDeckModalOpen && (
        <DeckManagerModal
          isOpen={isDeckModalOpen}
          deck={editingDeck}
          cards={editingDeck ? cards.filter((c) => c.deck_id === editingDeck.id) : []}
          projects={projects}
          onClose={closeDeckModal}
          onSaveDeck={createDeck}
          onUpdateDeck={updateDeck}
          onCreateCard={createCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onImportCards={importCards}
          onExportDeck={exportDeck}
        />
      )}
    </div>
  );
};
