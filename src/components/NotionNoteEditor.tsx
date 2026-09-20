import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Subtask, Project } from '../types';
import { NotionToolbar } from './notion/NotionToolbar';
import { NotionMarkdownRenderer } from './notion/NotionMarkdownRenderer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface NotionNoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  subtask: Subtask | null;
  project?: Project | null;
  onSaveNotes: (subtaskId: string, notes: string) => void;
}

export const NotionNoteEditor: React.FC<NotionNoteEditorProps> = ({
  isOpen,
  onClose,
  subtask,
  project,
  onSaveNotes,
}) => {
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [saveIndicator, setSaveIndicator] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (subtask) {
      setContent(subtask.notes || '');
    }
  }, [subtask]);

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    if (subtask) {
      onSaveNotes(subtask.id, newVal);
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 1500);
    }
  };

  // Callback de inserção de texto transcrito via voz
  const handleSpeechResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!isFinal || !transcript.trim() || !subtask) return;

      const textarea = textareaRef.current;
      const cleanTranscript = transcript.trim();

      setContent((prev) => {
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

        onSaveNotes(subtask.id, newContent);
        setSaveIndicator(true);
        setTimeout(() => setSaveIndicator(false), 1500);
        return newContent;
      });
    },
    [subtask, onSaveNotes]
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

  // Atalho de teclado Alt+D para iniciar/parar ditado por voz
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

  // Encerra a gravação caso o modal seja fechado
  const handleClose = () => {
    if (isListening) {
      stopSpeech();
    }
    onClose();
  };

  if (!isOpen || !subtask) return null;

  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const before = content.substring(0, start);
    const after = content.substring(end);

    const inserted = `${prefix}${selectedText}${suffix}`;
    const newContent = `${before}${inserted}${after}`;

    setContent(newContent);
    onSaveNotes(subtask.id, newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-box notion-editor-modal"
        style={{ maxWidth: '840px', height: '85vh', maxHeight: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Editor */}
        <div className="modal-header notion-editor-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {project && (
                <span
                  className="discipline-tag"
                  style={{
                    backgroundColor: `${project.color}20`,
                    borderColor: `${project.color}40`,
                    color: project.color,
                  }}
                >
                  {project.icon || '📁'} {project.title}
                </span>
              )}
              <span className={`priority-pill priority-${subtask.priority}`}>
                {subtask.priority}
              </span>
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>
              📝 {subtask.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saveIndicator && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Save size={14} /> Salvo
              </span>
            )}
            <button className="icon-btn" onClick={handleClose} aria-label="Fechar editor">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Ferramentas Estilo Notion */}
        <NotionToolbar
          onInsertText={insertTextAtCursor}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isListening={isListening}
          onToggleSpeech={toggleSpeech}
          isSpeechSupported={isSpeechSupported}
        />

        {/* Banner Flutuante de Ditado por Voz em Andamento */}
        {isListening && (
          <div className="notion-dictation-banner">
            <div className="dictation-left">
              <span className="dictation-pulse-dot" />
              <span className="dictation-label">🎙️ Ditando em tempo real:</span>
              <span className="dictation-preview">
                {interimTranscript ? `"${interimTranscript}"` : 'Fale suas anotações... sua voz será transcrita no cursor.'}
              </span>
            </div>
            <button
              type="button"
              className="dictation-stop-btn"
              onClick={stopSpeech}
              title="Parar ditado por voz"
            >
              Parar Ditado
            </button>
          </div>
        )}

        {/* Mensagem de Erro de Reconhecimento de Voz */}
        {speechError && (
          <div className="notion-speech-error">
            <AlertCircle size={14} />
            <span>{speechError}</span>
          </div>
        )}

        {/* Corpo do Editor */}
        <div className={`notion-editor-body view-${viewMode}`}>
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="notion-pane editor-pane">
              <textarea
                ref={textareaRef}
                className="notion-textarea"
                placeholder="Comece a digitar suas anotações ou digite # para títulos, - [ ] para tarefas..."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="notion-pane preview-pane">
              <NotionMarkdownRenderer
                content={content}
                onContentChange={handleContentChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
