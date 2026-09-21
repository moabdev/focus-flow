import React from 'react';
import { Check, Folder, CheckSquare, Mic, MicOff, Copy, Trash2, Sparkles, Plus } from 'lucide-react';
import { QuickNote, Project, Subtask } from '@/features/core/types';

interface DraftEditorProps {
  activeNote: QuickNote | null;
  projects: Project[];
  projectSubtasks: Subtask[];
  isSaved: boolean;
  isSpeechSupported: boolean;
  isListening: boolean;
  copiedId: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleUpdateActiveNote: (updates: Partial<QuickNote>) => void;
  handleCreateDraft: () => void;
  toggleSpeech: () => void;
  getWordCount: (text?: string) => number;
  formatDate: (isoString?: string) => string;
  handleCopyNote: (note: QuickNote, e?: React.MouseEvent) => void;
  setNoteToDelete: (note: QuickNote) => void;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({
  activeNote,
  projects,
  projectSubtasks,
  isSaved,
  isSpeechSupported,
  isListening,
  copiedId,
  textareaRef,
  handleUpdateActiveNote,
  handleCreateDraft,
  toggleSpeech,
  getWordCount,
  formatDate,
  handleCopyNote,
  setNoteToDelete,
}) => {
  if (!activeNote) {
    return (
      <div className="drafts-split-editor-panel empty-selection" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '2rem' }}>
        <Sparkles size={36} color="var(--accent-primary)" />
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Selecione um rascunho</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          Escolha uma nota na lista ao lado ou crie um novo rascunho para começar a editar.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleCreateDraft}>
          <Plus size={14} />
          <span>Novo Rascunho</span>
        </button>
      </div>
    );
  }

  return (
    <div className="drafts-split-editor-panel">
      {/* Topo do Editor: Título e Status de Salvamento */}
      <div className="drafts-editor-top-bar">
        <input
          type="text"
          className="drafts-editor-title-input"
          placeholder="Título do rascunho..."
          value={activeNote.title}
          onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="drafts-save-status">
            <Check size={13} /> {isSaved ? 'Salvo' : 'Salvando...'}
          </span>
        </div>
      </div>

      {/* Barra de Metadados: Vínculo com Projeto e Subtarefa + Ditado por Voz */}
      <div className="drafts-editor-meta-row">
        <div className="drafts-linking-controls">
          {/* Seleção de Projeto */}
          <div className="drafts-link-group">
            <Folder size={14} color="var(--accent-primary)" />
            <select
              className="drafts-link-select"
              value={activeNote.project_id || ''}
              onChange={(e) => {
                const pId = e.target.value || null;
                handleUpdateActiveNote({ project_id: pId, subtask_id: null });
              }}
              title="Vincular a um projeto"
            >
              <option value="">Nenhum Projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon || '📁'} {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Subtarefa (se houver projeto vinculado) */}
          {activeNote.project_id && projectSubtasks.length > 0 && (
            <div className="drafts-link-group">
              <CheckSquare size={14} color="#10b981" />
              <select
                className="drafts-link-select"
                value={activeNote.subtask_id || ''}
                onChange={(e) => handleUpdateActiveNote({ subtask_id: e.target.value || null })}
                title="Vincular a uma subtarefa"
              >
                <option value="">Nenhuma Subtarefa</option>
                {projectSubtasks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ditado por Voz */}
        <div className="drafts-editor-speech-box">
          {isSpeechSupported && (
            <button
              type="button"
              className={`draft-mic-btn ${isListening ? 'active' : ''}`}
              onClick={toggleSpeech}
              title={isListening ? 'Parar ditado por voz (Alt+D)' : 'Iniciar ditado por voz (Alt+D)'}
            >
              {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{isListening ? 'Ouvindo...' : 'Ditar (Alt+D)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de Escrita */}
      <div className="drafts-textarea-wrapper">
        <textarea
          ref={textareaRef}
          className="drafts-editor-textarea"
          placeholder="Escreva livremente suas ideias, resumos de matérias, anotações de questões ou tópicos de estudo..."
          value={activeNote.content || ''}
          onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
        />
      </div>

      {/* Rodapé do Editor: Contadores e Ações Rápidas */}
      <div className="drafts-editor-bottom-bar">
        <div className="drafts-editor-counts">
          {getWordCount(activeNote.content)} palavras • {(activeNote.content || '').length} caracteres • {formatDate(activeNote.updated_at || activeNote.created_at)}
        </div>

        <div className="drafts-editor-actions">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            onClick={(e) => handleCopyNote(activeNote, e)}
          >
            {copiedId === activeNote.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copiedId === activeNote.id ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setNoteToDelete(activeNote)}
          >
            <Trash2 size={13} />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
