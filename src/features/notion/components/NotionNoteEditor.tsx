import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Subtask, Project } from '@/features/core/types';
import { NotionToolbar } from './notion/NotionToolbar';
import { NotionMarkdownRenderer } from './notion/NotionMarkdownRenderer';
import { NotionEditorHeader } from './notion/NotionEditorHeader';
import { NotionDictationBanner } from './notion/NotionDictationBanner';
import { useSpeechRecognition } from '@/features/zenmode/hooks/useSpeechRecognition';

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
        <NotionEditorHeader
          project={project}
          subtask={subtask}
          saveIndicator={saveIndicator}
          onClose={handleClose}
        />

        <NotionToolbar
          onInsertText={insertTextAtCursor}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isListening={isListening}
          onToggleSpeech={toggleSpeech}
          isSpeechSupported={isSpeechSupported}
        />

        <NotionDictationBanner
          isListening={isListening}
          interimTranscript={interimTranscript}
          onStopSpeech={stopSpeech}
        />

        {speechError && (
          <div className="notion-speech-error">
            <AlertCircle size={14} />
            <span>{speechError}</span>
          </div>
        )}

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
