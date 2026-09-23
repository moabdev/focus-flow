import '../../styles/flashcards.css';
import React, { useMemo } from 'react';
import { Layers, Plus, Search, Filter } from 'lucide-react';
import { Project, FlashcardDeck } from '@/features/core/types';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { FlashcardStudyModal } from './FlashcardStudyModal';
import { DeckManagerModal } from './DeckManagerModal';
import { FlashcardsStatsBanner } from './FlashcardsStatsBanner';
import { FlashcardsDeckList } from './FlashcardsDeckList';

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

      <FlashcardsStatsBanner
        dueCardsCount={dueCardsCount}
        totalCardsCount={totalCardsCount}
        decksCount={decks.length}
      />

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

      <FlashcardsDeckList
        decks={filteredDecks}
        projects={projects}
        searchQuery={searchQuery}
        selectedProjectId={selectedProjectId}
        openCreateDeckModal={openCreateDeckModal}
        openStudyModal={openStudyModal}
        openEditDeckModal={openEditDeckModal}
        deleteDeck={deleteDeck}
      />

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

