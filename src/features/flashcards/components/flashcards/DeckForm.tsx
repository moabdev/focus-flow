import React from 'react';
import { Project, FlashcardDeck } from '@/features/core/types';

const COLOR_PRESETS = ['#ff2a5f', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
const ICON_PRESETS = ['💻', '⚖️', '🩺', '🌐', '📚', '🚀', '🧠', '💡', '🎯', '🔬'];

export interface DeckFormProps {
  deck: FlashcardDeck | null;
  projects: Project[];
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  icon: string;
  setIcon: (val: string) => void;
  projectId: string | undefined;
  setProjectId: (val: string | undefined) => void;
  tagsText: string;
  setTagsText: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DeckForm: React.FC<DeckFormProps> = ({
  deck,
  projects,
  title,
  setTitle,
  description,
  setDescription,
  color,
  setColor,
  icon,
  setIcon,
  projectId,
  setProjectId,
  tagsText,
  setTagsText,
  onClose,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
  );
};
