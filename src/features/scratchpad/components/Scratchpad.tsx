import React from 'react';
import {
  X,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Folder,
  CheckSquare,
  Mic,
  MicOff,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Project, Subtask } from '@/features/core/types';
import { useScratchpad } from './useScratchpad';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  subtasks?: Subtask[];
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose, projects = [], subtasks = [] }) => {
  const {
    notes,
    filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    isSaved,
    copied,
    searchQuery,
    setSearchQuery,
    confirmDeleteId,
    setConfirmDeleteId,
    textareaRef,
    isSpeechSupported,
    isListening,
    interimTranscript,
    speechError,
    toggleSpeech,
    stopSpeech,
    handleCloseDrawer,
    handleCreateNote,
    handleTitleChange,
    handleContentChange,
    handleProjectChange,
    handleSubtaskChange,
    handleDeleteNote,
    handleCopyNote,
    availableSubtasks,
  } = useScratchpad(isOpen, onClose, projects, subtasks);

  if (!isOpen) return null;

  return (
    <aside className="scratchpad-drawer" aria-label="Notas Rápidas & Rascunho">
      <div className="modal-header scratchpad-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" />
          <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>Rascunho & Notas</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button type="button" className="scratchpad-new-btn" onClick={handleCreateNote} title="Criar nova nota rápida">
            <Plus size={14} /> Nova Nota
          </button>
          <button className="icon-btn" onClick={handleCloseDrawer} title="Fechar gaveta (Esc)">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="scratchpad-nav-section">
        {notes.length > 2 && (
          <div className="scratchpad-search-wrap">
            <Search size={14} className="scratchpad-search-icon" />
            <input
              type="text"
              placeholder="Buscar rascunhos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="scratchpad-search-input"
            />
          </div>
        )}
        <div className="scratchpad-tabs-bar">
          {filteredNotes.map((note) => {
            const linkedProject = projects.find((p) => p.id === note.project_id);
            const isActive = note.id === activeNote?.id;
            return (
              <button
                key={note.id}
                type="button"
                className={`scratchpad-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id)}
                title={note.title}
              >
                {linkedProject && <span className="tab-proj-dot" style={{ backgroundColor: linkedProject.color || 'var(--accent-primary)' }} />}
                <span className="tab-pill-title">{note.title.trim() || 'Sem título'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeNote ? (
        <div className="scratchpad-active-container">
          <div className="scratchpad-title-bar">
            <input
              type="text"
              className="scratchpad-title-input"
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do rascunho..."
            />
          </div>

          <div className="scratchpad-link-bar">
            <div className="link-select-group">
              <Folder size={14} className="link-icon" />
              <select aria-label="Vincular a Projeto" className="scratchpad-select" value={activeNote.project_id || ''} onChange={(e) => handleProjectChange(e.target.value)}>
                <option value="">📁 Sem projeto vinculado</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon || '📁'} {p.title}</option>
                ))}
              </select>
            </div>
            <div className="link-select-group">
              <CheckSquare size={14} className="link-icon" />
              <select aria-label="Vincular a Subtarefa" className="scratchpad-select" value={activeNote.subtask_id || ''} onChange={(e) => handleSubtaskChange(e.target.value)}>
                <option value="">📌 Sem subtarefa vinculada</option>
                {availableSubtasks.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="scratchpad-tools-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className={`scratchpad-tool-btn scratchpad-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleSpeech}
                title={!isSpeechSupported ? 'Não suportado' : isListening ? 'Parar Transcrição' : 'Ditado (Alt+D)'}
                aria-label="Ditado por voz"
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                <span style={{ fontSize: '0.75rem' }}>{isListening ? 'Gravando...' : 'Voz'}</span>
              </button>
              <button type="button" className="scratchpad-tool-btn" onClick={handleCopyNote} title="Copiar" aria-label="Copiar nota">
                {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span style={{ fontSize: '0.75rem' }}>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {confirmDeleteId === activeNote.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button type="button" className="scratchpad-confirm-delete-btn" onClick={() => handleDeleteNote(activeNote.id)}>Excluir?</button>
                <button type="button" className="scratchpad-tool-btn" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              </div>
            ) : (
              <button type="button" className="scratchpad-tool-btn delete-btn" onClick={() => setConfirmDeleteId(activeNote.id)} title="Excluir" aria-label="Excluir nota">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {isListening && (
            <div className="scratchpad-dictation-banner">
              <span className="dictation-pulse-dot" />
              <span className="dictation-preview">{interimTranscript ? `"${interimTranscript}"` : 'Fale suas anotações...'}</span>
              <button type="button" className="dictation-stop-btn" onClick={stopSpeech}>Parar</button>
            </div>
          )}

          {speechError && (
            <div className="scratchpad-speech-error">
              <AlertCircle size={14} /> <span>{speechError}</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="scratchpad-textarea"
            placeholder="Digite suas anotações, fórmulas ou insights..."
            value={activeNote.content}
            onChange={(e) => handleContentChange(e.target.value)}
            autoFocus
          />

          <div className="scratchpad-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} color={isSaved ? '#10b981' : 'var(--text-muted)'} />
              {isSaved ? 'Salvo automaticamente' : 'Salvando...'}
            </span>
            <span>{activeNote.content.length} caracteres</span>
          </div>
        </div>
      ) : (
        <div className="scratchpad-empty-state">
          <FileText size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
          <p>Nenhuma anotação selecionada.</p>
          <button type="button" className="scratchpad-new-btn" onClick={handleCreateNote}>
            <Plus size={14} /> Criar Primeiro Rascunho
          </button>
        </div>
      )}
    </aside>
  );
};
