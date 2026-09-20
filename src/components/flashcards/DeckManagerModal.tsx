import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Upload, Download, Tag, FolderKanban } from 'lucide-react';
import { Flashcard, FlashcardDeck, Project } from '../../types';

interface DeckManagerModalProps {
  isOpen: boolean;
  deck: FlashcardDeck | null; // null se estiver criando novo baralho
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

const COLOR_PRESETS = ['#ff2a5f', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
const ICON_PRESETS = ['💻', '⚖️', '🩺', '🌐', '📚', '🚀', '🧠', '💡', '🎯', '🔬'];

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

  // Estado do formulário de baralho
  const [title, setTitle] = useState(deck?.title || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [color, setColor] = useState(deck?.color || COLOR_PRESETS[0]);
  const [icon, setIcon] = useState(deck?.icon || '📚');
  const [projectId, setProjectId] = useState<string | undefined>(deck?.project_id);
  const [tagsText, setTagsText] = useState(deck?.tags?.join(', ') || '');

  // Estado do formulário de novo cartão
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Estado de importação
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveDeckInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

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
        {/* Header do Modal */}
        <div className="study-header">
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {deck ? `Gerenciar Baralho: ${deck.title}` : 'Novo Baralho de Flashcards'}
          </h2>
          <button className="btn-deck-icon" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
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

        {/* Aba 1: Informações do Baralho */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveDeckInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Título do Baralho *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Engenharia de Software, Farmacologia, OAB..."
                required
                className="mindmap-node-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve resumo sobre o foco deste baralho..."
                rows={2}
                className="mindmap-node-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Ícone e Cor */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Ícone / Emoji
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {ICON_PRESETS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      style={{
                        fontSize: '1.2rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        border: icon === ic ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Cor Temática
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`node-color-swatch ${color === c ? 'active' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vínculo a Projeto */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Vincular a um Projeto (Opcional)
              </label>
              <select
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value || undefined)}
                className="flashcards-filter-select"
                style={{ width: '100%' }}
              >
                <option value="">Sem vínculo com projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Ex: Concursos, TI, Revisão..."
                className="mindmap-node-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-deck-icon" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-study-deck" style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
                {deck ? 'Atualizar Baralho' : 'Criar Baralho'}
              </button>
            </div>
          </form>
        )}

        {/* Aba 2: Gerenciar Cartões */}
        {activeTab === 'cards' && deck && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Formulário de Adicionar / Editar Cartão */}
            <form
              onSubmit={handleAddOrUpdateCard}
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

            {/* Lista de Cartões Existentes */}
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
                        onClick={() => handleEditCardClick(c)}
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
        )}

        {/* Aba 3: Importar / Exportar */}
        {activeTab === 'import' && deck && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                Importar em Lote (Texto ou CSV)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Cole seus cartões abaixo. Formato aceito: <code>Pergunta;Resposta;Dica (opcional)</code>, uma linha por cartão.
              </p>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Pergunta 1;Resposta detalhada 1;Dica 1&#10;Pergunta 2;Resposta detalhada 2"
              rows={6}
              className="mindmap-node-input"
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />

            {importFeedback && (
              <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                {importFeedback}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-study-deck"
                onClick={handleExecuteImport}
                disabled={!importText.trim()}
                style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
              >
                <Upload size={16} /> Importar Cartões
              </button>

              <button
                className="btn-study-deck"
                onClick={handleExportClick}
                style={{ width: 'auto', padding: '0.5rem 1.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <Download size={16} /> Exportar Baralho (JSON)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
