import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { Subtask, Project } from '../types';
import { NotionToolbar } from './notion/NotionToolbar';
import { NotionMarkdownRenderer } from './notion/NotionMarkdownRenderer';

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

  if (!isOpen || !subtask) return null;

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    onSaveNotes(subtask.id, newVal);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

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
    <div className="modal-backdrop" onClick={onClose}>
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
            <button className="icon-btn" onClick={onClose} aria-label="Fechar editor">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Ferramentas Estilo Notion */}
        <NotionToolbar
          onInsertText={insertTextAtCursor}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

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
