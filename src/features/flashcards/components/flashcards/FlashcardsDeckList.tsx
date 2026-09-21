import React, { useState } from 'react';
import { Plus, CheckCircle, Play, Settings2, Trash2 } from 'lucide-react';
import { FlashcardDeck, Project } from '@/features/core/types';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';

interface FlashcardsDeckListProps {
  decks: FlashcardDeck[];
  projects: Project[];
  searchQuery: string;
  selectedProjectId: string;
  openCreateDeckModal: () => void;
  openStudyModal: (deckId: string) => void;
  openEditDeckModal: (deck: FlashcardDeck) => void;
  deleteDeck: (deckId: string) => void;
}

export const FlashcardsDeckList: React.FC<FlashcardsDeckListProps> = ({
  decks,
  projects,
  searchQuery,
  selectedProjectId,
  openCreateDeckModal,
  openStudyModal,
  openEditDeckModal,
  deleteDeck,
}) => {
  const [deckToDelete, setDeckToDelete] = useState<FlashcardDeck | null>(null);

  if (decks.length === 0) {
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
    );
  }

  return (
    <>
      <div className="decks-list">
        {decks.map((deck) => {
          const hasDue = (deck.due_count || 0) > 0;
          const project = projects.find((p) => p.id === deck.project_id);

          return (
            <div key={deck.id} className="deck-list-item">
              <div className="deck-list-item-color-bar" style={{ background: deck.color }} />

              <div className="deck-list-item-icon">{deck.icon}</div>

              <div className="deck-list-item-content">
                <div className="deck-list-item-header">
                  <h3 className="deck-list-item-title">{deck.title}</h3>
                  {project && (
                    <span className="deck-list-project">
                      {project.icon || '📁'} {project.title}
                    </span>
                  )}
                </div>

                {deck.description && <p className="deck-list-item-desc">{deck.description}</p>}

                <div className="deck-list-item-meta">
                  <span className="deck-list-count">
                    <strong>{deck.card_count || 0}</strong> {deck.card_count === 1 ? 'cartão' : 'cartões'}
                  </span>
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="deck-tags-row" style={{ marginTop: 0 }}>
                      {deck.tags.map((t, i) => (
                        <span key={i} className="deck-tag-pill">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="deck-list-item-status">
                {hasDue ? (
                  <span className="deck-due-badge">
                    {deck.due_count} {deck.due_count === 1 ? 'pendente' : 'pendentes'}
                  </span>
                ) : (
                  <span className="deck-done-badge">
                    <CheckCircle size={13} /> Em dia
                  </span>
                )}
              </div>

              <div className="deck-list-item-actions">
                <button
                  className="btn-study-deck"
                  onClick={() => openStudyModal(deck.id)}
                  title="Iniciar Sessão de Estudo"
                >
                  <Play size={16} /> Estudar
                </button>

                <button
                  className="btn-deck-icon"
                  onClick={() => openEditDeckModal(deck)}
                  title="Gerenciar / Adicionar Cartões"
                >
                  <Settings2 size={16} />
                </button>

                <button
                  className="btn-deck-icon"
                  onClick={() => setDeckToDelete(deck)}
                  title="Excluir Baralho"
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
        isOpen={!!deckToDelete}
        title="Excluir Baralho"
        message={
          <>
            Tem certeza que deseja excluir o baralho <strong>"{deckToDelete?.title}"</strong> e todos os seus cartões? Esta ação não pode ser desfeita.
          </>
        }
        confirmText="Excluir Baralho"
        onConfirm={() => {
          if (deckToDelete) {
            deleteDeck(deckToDelete.id);
            setDeckToDelete(null);
          }
        }}
        onCancel={() => setDeckToDelete(null)}
      />
    </>
  );
};
