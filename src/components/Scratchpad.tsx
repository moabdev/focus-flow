import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { storageService } from '../services/storage';
import { QuickNote, Project, Subtask } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  subtasks?: Subtask[];
}

export const Scratchpad: React.FC<ScratchpadProps> = ({
  isOpen,
  onClose,
  projects = [],
  subtasks = [],
}) => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega as notas ao abrir
  useEffect(() => {
    if (isOpen) {
      const loaded = storageService.getQuickNotes();
      setNotes(loaded);
      if (loaded.length > 0) {
        // Mantém a nota ativa se ainda existir, ou seleciona a primeira
        setActiveNoteId((prev) => (loaded.some((n) => n.id === prev) ? prev : loaded[0].id));
      }
    }
  }, [isOpen]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  // Inserção de transcrição por voz no rascunho
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal || !transcript.trim() || !activeNote) return;

      const textarea = textareaRef.current;
      const cleanTranscript = transcript.trim();

      const prev = activeNote.content || '';
      let newContent = '';

      if (textarea) {
        const start = textarea.selectionStart ?? prev.length;
        const end = textarea.selectionEnd ?? prev.length;
        const before = prev.substring(0, start);
        const after = prev.substring(end);

        const needSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
        const prefix = needSpaceBefore ? ' ' : '';

        newContent = `${before}${prefix}${cleanTranscript} ${after}`;

        setTimeout(() => {
          if (textareaRef.current) {
            const nextCursor = start + prefix.length + cleanTranscript.length + 1;
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
            textareaRef.current.focus();
          }
        }, 25);
      } else {
        const needSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
        newContent = `${prev}${needSpace ? ' ' : ''}${cleanTranscript} `;
      }

      storageService.updateQuickNote(activeNote.id, { content: newContent });
      setNotes(storageService.getQuickNotes());
      setIsSaved(true);
    },
    [activeNote]
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    interimTranscript,
    errorMessage: speechError,
    toggleListening: toggleSpeech,
    stopListening: stopSpeech,
  } = useSpeechRecognition({
    lang: 'pt-BR',
    continuous: true,
    interimResults: true,
    onResult: handleSpeechResult,
  });

  // Atalho Alt+D para microfone
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSpeech]);

  // Encerra escuta ao fechar gaveta
  const handleCloseDrawer = () => {
    if (isListening) stopSpeech();
    onClose();
  };

  // CRUD: Criar nova nota
  const handleCreateNote = () => {
    const newNote = storageService.createQuickNote({
      title: 'Novo Rascunho',
      content: '',
      project_id: null,
      subtask_id: null,
    });
    const updated = storageService.getQuickNotes();
    setNotes(updated);
    setActiveNoteId(newNote.id);
  };

  // CRUD: Atualizar título
  const handleTitleChange = (newTitle: string) => {
    if (!activeNote) return;
    storageService.updateQuickNote(activeNote.id, { title: newTitle });
    setNotes(storageService.getQuickNotes());
  };

  // CRUD: Atualizar conteúdo (com debounce)
  const handleContentChange = (newVal: string) => {
    if (!activeNote) return;
    setIsSaved(false);

    // Atualização otimista no estado local
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote.id ? { ...n, content: newVal } : n))
    );

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      storageService.updateQuickNote(activeNote.id, { content: newVal });
      setIsSaved(true);
    }, 400);
  };

  // CRUD: Vincular a Projeto
  const handleProjectChange = (projId: string) => {
    if (!activeNote) return;
    const pid = projId === '' ? null : projId;
    storageService.updateQuickNote(activeNote.id, {
      project_id: pid,
      subtask_id: null, // reseta subtarefa vinculada ao trocar de projeto
    });
    setNotes(storageService.getQuickNotes());
  };

  // CRUD: Vincular a Subtarefa
  const handleSubtaskChange = (subId: string) => {
    if (!activeNote) return;
    const sid = subId === '' ? null : subId;
    storageService.updateQuickNote(activeNote.id, { subtask_id: sid });
    setNotes(storageService.getQuickNotes());
  };

  // CRUD: Excluir nota
  const handleDeleteNote = (id: string) => {
    storageService.deleteQuickNote(id);
    const remaining = storageService.getQuickNotes();
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining[0]?.id || null);
    }
    setConfirmDeleteId(null);
  };

  // Copiar conteúdo
  const handleCopyNote = () => {
    if (!activeNote?.content) return;
    navigator.clipboard?.writeText(activeNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Subtarefas disponíveis para vinculação (filtradas pelo projeto selecionado, se houver)
  const availableSubtasks = activeNote?.project_id
    ? subtasks.filter((s) => s.project_id === activeNote.project_id)
    : subtasks;

  // Filtro de notas por busca
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = n.title.toLowerCase().includes(q);
    const contentMatch = n.content.toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  if (!isOpen) return null;

  return (
    <aside className="scratchpad-drawer" aria-label="Notas Rápidas & Rascunho">
      {/* Header da Gaveta */}
      <div className="modal-header scratchpad-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" />
          <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>
            Rascunho & Notas
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="scratchpad-new-btn"
            onClick={handleCreateNote}
            title="Criar nova nota rápida"
            aria-label="Nova Nota"
          >
            <Plus size={14} /> Nova Nota
          </button>
          <button
            className="icon-btn"
            onClick={handleCloseDrawer}
            title="Fechar gaveta (Esc)"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Busca e Barra de Seleção de Notas */}
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

        {/* Abas / Lista Horizontal de Notas */}
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
                {linkedProject && (
                  <span
                    className="tab-proj-dot"
                    style={{ backgroundColor: linkedProject.color || 'var(--accent-primary)' }}
                  />
                )}
                <span className="tab-pill-title">
                  {note.title.trim() || 'Sem título'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeNote ? (
        <div className="scratchpad-active-container">
          {/* Título da Nota Ativa */}
          <div className="scratchpad-title-bar">
            <input
              type="text"
              className="scratchpad-title-input"
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do rascunho..."
            />
          </div>

          {/* Barra de Vinculação (Projeto & Subtask) */}
          <div className="scratchpad-link-bar">
            <div className="link-select-group">
              <Folder size={14} className="link-icon" />
              <select
                aria-label="Vincular a Projeto"
                className="scratchpad-select"
                value={activeNote.project_id || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                title="Vincular esta nota a um projeto"
              >
                <option value="">📁 Sem projeto vinculado</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="link-select-group">
              <CheckSquare size={14} className="link-icon" />
              <select
                aria-label="Vincular a Subtarefa"
                className="scratchpad-select"
                value={activeNote.subtask_id || ''}
                onChange={(e) => handleSubtaskChange(e.target.value)}
                title="Vincular esta nota a uma subtarefa"
              >
                <option value="">📌 Sem subtarefa vinculada</option>
                {availableSubtasks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de Ferramentas da Nota (Transcrição / Copiar / Excluir) */}
          <div className="scratchpad-tools-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Botão de Ditado por Voz / Transcrição */}
              <button
                type="button"
                className={`scratchpad-tool-btn scratchpad-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleSpeech}
                title={
                  !isSpeechSupported
                    ? 'Reconhecimento de voz não suportado neste navegador'
                    : isListening
                    ? 'Parar Transcrição'
                    : 'Transcrever por Voz / Ditado (Alt+D)'
                }
                aria-label="Ditado por voz"
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                <span style={{ fontSize: '0.75rem' }}>
                  {isListening ? 'Gravando...' : 'Voz'}
                </span>
              </button>

              {/* Botão de Copiar */}
              <button
                type="button"
                className="scratchpad-tool-btn"
                onClick={handleCopyNote}
                title="Copiar anotação para a área de transferência"
                aria-label="Copiar nota"
              >
                {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span style={{ fontSize: '0.75rem' }}>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Botão de Excluir */}
            {confirmDeleteId === activeNote.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="scratchpad-confirm-delete-btn"
                  onClick={() => handleDeleteNote(activeNote.id)}
                >
                  Excluir?
                </button>
                <button
                  type="button"
                  className="scratchpad-tool-btn"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="scratchpad-tool-btn delete-btn"
                onClick={() => setConfirmDeleteId(activeNote.id)}
                title="Excluir este rascunho"
                aria-label="Excluir nota"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Banner de Ditado Ativo */}
          {isListening && (
            <div className="scratchpad-dictation-banner">
              <span className="dictation-pulse-dot" />
              <span className="dictation-preview">
                {interimTranscript ? `"${interimTranscript}"` : 'Fale suas anotações...'}
              </span>
              <button
                type="button"
                className="dictation-stop-btn"
                onClick={stopSpeech}
                title="Concluir gravação"
              >
                Parar
              </button>
            </div>
          )}

          {speechError && (
            <div className="scratchpad-speech-error">
              <AlertCircle size={14} />
              <span>{speechError}</span>
            </div>
          )}

          {/* Área de Texto Principal */}
          <textarea
            ref={textareaRef}
            className="scratchpad-textarea"
            placeholder="Digite suas anotações, fórmulas ou insights..."
            value={activeNote.content}
            onChange={(e) => handleContentChange(e.target.value)}
            autoFocus
          />

          {/* Footer de Status */}
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
