import React, { useState } from 'react';
import { X, Sparkles, Save, Trash2, ArrowRight } from 'lucide-react';
import { GeneratedFlashcard } from '@/services/ai/geminiService';

interface AIGenerateFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: GeneratedFlashcard[];
  onSave: (selectedCards: GeneratedFlashcard[]) => void;
  isSaving: boolean;
}

export const AIGenerateFlashcardsModal: React.FC<AIGenerateFlashcardsModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  onSave,
  isSaving,
}) => {
  const [cards, setCards] = useState<GeneratedFlashcard[]>(flashcards);

  if (!isOpen) return null;

  const handleRemove = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(cards);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-box glass-panel" style={{ maxWidth: '700px', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            Flashcards Gerados
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-content" style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cards.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>
              Nenhum flashcard para salvar.
            </div>
          ) : (
            cards.map((card, idx) => (
              <div key={idx} style={{ 
                background: 'var(--color-bg-tertiary)', 
                borderRadius: '8px', 
                padding: '16px', 
                border: '1px solid var(--color-border)',
                position: 'relative'
              }}>
                <button 
                  onClick={() => handleRemove(idx)}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  title="Remover Cartão"
                >
                  <Trash2 size={16} />
                </button>
                
                <div style={{ marginBottom: '12px', paddingRight: '24px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>FRENTE (Pergunta)</strong>
                  <div style={{ fontSize: '1.05rem', fontWeight: 500 }}>{card.front}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
                  <ArrowRight size={14} />
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>VERSO (Resposta)</strong>
                  <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>{card.back}</div>
                </div>
                
                {(card.hint || (card.tags && card.tags.length > 0)) && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {card.hint && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Dica: {card.hint}</span>}
                    {card.tags && card.tags.map(t => (
                      <span key={t} style={{ background: 'var(--color-bg-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving || cards.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} />
            {isSaving ? 'Salvando...' : `Salvar ${cards.length} Cartões`}
          </button>
        </div>
      </div>
    </div>
  );
};
