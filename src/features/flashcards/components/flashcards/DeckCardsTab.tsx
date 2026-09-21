import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Flashcard } from '@/features/core/types';

export interface DeckCardsTabProps {
  cards: Flashcard[];
  newFront: string;
  setNewFront: (val: string) => void;
  newBack: string;
  setNewBack: (val: string) => void;
  newHint: string;
  setNewHint: (val: string) => void;
  editingCardId: string | null;
  setEditingCardId: (val: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEditClick: (card: Flashcard) => void;
  onDeleteCard: (id: string) => void;
}

export const DeckCardsTab: React.FC<DeckCardsTabProps> = ({
  cards,
  newFront,
  setNewFront,
  newBack,
  setNewBack,
  newHint,
  setNewHint,
  editingCardId,
  setEditingCardId,
  onSubmit,
  onEditClick,
  onDeleteCard,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form
        onSubmit={onSubmit}
        style={{
          background: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {editingCardId ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            Frente (Pergunta / Termo / Conceito) *
          </label>
          <textarea
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Ex: Qual é a diferença entre REST e GraphQL?"
            rows={2}
            required
            className="mindmap-node-input"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            Verso (Resposta / Explicação Detalhada) *
          </label>
          <textarea
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Ex: REST utiliza múltiplos endpoints com esquemas fixos. GraphQL expõe um único endpoint onde o cliente define os campos exatos..."
            rows={3}
            required
            className="mindmap-node-input"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            Dica Opcional (Gatilho de Memória)
          </label>
          <input
            type="text"
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            placeholder="Ex: Pense na analogia do buffet vs cardápio à la carte."
            className="mindmap-node-input"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {editingCardId && (
            <button
              type="button"
              className="btn-deck-icon"
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
              onClick={() => {
                setEditingCardId(null);
                setNewFront('');
                setNewBack('');
                setNewHint('');
              }}
            >
              Cancelar Edição
            </button>
          )}
          <button type="submit" className="btn-study-deck" style={{ width: 'auto', padding: '0.4rem 1rem' }}>
            <Plus size={16} /> {editingCardId ? 'Salvar Alterações' : 'Adicionar Cartão'}
          </button>
        </div>
      </form>

      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Nenhum cartão cadastrado ainda. Adicione o primeiro acima ou use a aba de importação.
          </div>
        ) : (
          cards.map((c, idx) => (
            <div
              key={c.id}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  #{idx + 1}: {c.front}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>
                  {c.back}
                </div>
                {c.hint && (
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                    💡 {c.hint}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  className="btn-deck-icon"
                  onClick={() => onEditClick(c)}
                  title="Editar Cartão"
                  aria-label="Editar Cartão"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn-deck-icon"
                  onClick={() => onDeleteCard(c.id)}
                  title="Excluir Cartão"
                  aria-label="Excluir Cartão"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
