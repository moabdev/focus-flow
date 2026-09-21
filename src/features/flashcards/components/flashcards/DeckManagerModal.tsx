import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Flashcard, FlashcardDeck, Project } from '@/features/core/types';
import { DeckForm } from './DeckForm';
import { DeckCardsTab } from './DeckCardsTab';
import { DeckImportExportTab } from './DeckImportExportTab';

const COLOR_PRESETS = ['#ff2a5f', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

interface DeckManagerModalProps {
  isOpen: boolean;
  deck: FlashcardDeck | null;
  cards: Flashcard[];
  projects: Project[];
  onClose: () => void;
  onSaveDeck: (data: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateDeck: (id: string, updates: Partial<FlashcardDeck>) => void;
  onCreateCard: (deckId: string, front: string, back: string, hint?: string, tags?: string[]) => void;
  onUpdateCard: (cardId: string, updates: Partial<Flashcard>) => void;
  onDeleteCard: (cardId: string) => void;
  onImportCards: (deckId: string, text: string) => number;
  onExportDeck: (deckId: string) => string;
}

export const DeckManagerModal: React.FC<DeckManagerModalProps> = ({
  isOpen,
  deck,
  cards,
  projects,
  onClose,
  onSaveDeck,
  onUpdateDeck,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onImportCards,
  onExportDeck,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'cards' | 'import'>('info');

  const [title, setTitle] = useState(deck?.title || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [color, setColor] = useState(deck?.color || COLOR_PRESETS[0]);
  const [icon, setIcon] = useState(deck?.icon || '📚');
  const [projectId, setProjectId] = useState<string | undefined>(deck?.project_id);
  const [tagsText, setTagsText] = useState(deck?.tags?.join(', ') || '');

  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveDeckInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsText.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    if (deck) {
      onUpdateDeck(deck.id, {
        title: title.trim(),
        description: description.trim(),
        color,
        icon,
        project_id: projectId || undefined,
        tags,
      });
    } else {
      onSaveDeck({
        title: title.trim(),
        description: description.trim(),
        color,
        icon,
        project_id: projectId || undefined,
        tags,
      });
    }
    onClose();
  };

  const handleAddOrUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck || !newFront.trim() || !newBack.trim()) return;

    if (editingCardId) {
      onUpdateCard(editingCardId, {
        front: newFront.trim(),
        back: newBack.trim(),
        hint: newHint.trim() || undefined,
      });
      setEditingCardId(null);
    } else {
      onCreateCard(deck.id, newFront.trim(), newBack.trim(), newHint.trim() || undefined);
    }
    setNewFront('');
    setNewBack('');
    setNewHint('');
  };

  const handleEditCardClick = (card: Flashcard) => {
    setEditingCardId(card.id);
    setNewFront(card.front);
    setNewBack(card.back);
    setNewHint(card.hint || '');
  };

  const handleExecuteImport = () => {
    if (!deck || !importText.trim()) return;
    const count = onImportCards(deck.id, importText);
    setImportFeedback(`${count} cartões importados com sucesso!`);
    setImportText('');
  };

  const handleExportClick = () => {
    if (!deck) return;
    const jsonStr = onExportDeck(deck.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${deck.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="study-modal-overlay" onClick={onClose}>
      <div className="study-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="study-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {deck ? `Gerenciar Baralho: ${deck.title}` : 'Novo Baralho de Flashcards'}
          </h2>
          <button className="btn-deck-icon" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        {deck && (
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              className={`btn-deck-icon ${activeTab === 'info' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
              onClick={() => setActiveTab('info')}
            >
              Configurações
            </button>
            <button
              className={`btn-deck-icon ${activeTab === 'cards' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
              onClick={() => setActiveTab('cards')}
            >
              Cartões ({cards.length})
            </button>
            <button
              className={`btn-deck-icon ${activeTab === 'import' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
              onClick={() => setActiveTab('import')}
            >
              Importar / Exportar
            </button>
          </div>
        )}

        {activeTab === 'info' && (
          <DeckForm
            deck={deck}
            projects={projects}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            color={color}
            setColor={setColor}
            icon={icon}
            setIcon={setIcon}
            projectId={projectId}
            setProjectId={setProjectId}
            tagsText={tagsText}
            setTagsText={setTagsText}
            onClose={onClose}
            onSubmit={handleSaveDeckInfo}
          />
        )}

        {activeTab === 'cards' && deck && (
          <DeckCardsTab
            cards={cards}
            newFront={newFront}
            setNewFront={setNewFront}
            newBack={newBack}
            setNewBack={setNewBack}
            newHint={newHint}
            setNewHint={setNewHint}
            editingCardId={editingCardId}
            setEditingCardId={setEditingCardId}
            onSubmit={handleAddOrUpdateCard}
            onEditClick={handleEditCardClick}
            onDeleteCard={onDeleteCard}
          />
        )}

        {activeTab === 'import' && deck && (
          <DeckImportExportTab
            importText={importText}
            setImportText={setImportText}
            importFeedback={importFeedback}
            onExecuteImport={handleExecuteImport}
            onExportClick={handleExportClick}
          />
        )}
      </div>
    </div>
  );
};
