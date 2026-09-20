import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heading1,
  Heading2,
  CheckSquare,
  List,
  ListOrdered,
  Code,
  Quote,
  Bold,
  Italic,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Save,
} from 'lucide-react';
import { Subtask, Project } from '../types';

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

  // Renderização simples e elegante de Markdown estilo Notion com suporte a checklists clicáveis
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
          Nenhuma anotação ainda. Use a barra de ferramentas acima para adicionar títulos, checklists, callouts ou código!
        </div>
      );
    }

    const lines = text.split('\n');

    return (
      <div className="notion-preview-content">
        {lines.map((line, idx) => {
          // 1. Título H1
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="notion-h1">{line.replace('# ', '')}</h1>;
          }
          // 2. Título H2
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="notion-h2">{line.replace('## ', '')}</h2>;
          }
          // 3. Título H3
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="notion-h3">{line.replace('### ', '')}</h3>;
          }
          // 4. Checklists interativos [ ] ou [x]
          if (/^- \[( |x)\] /i.test(line)) {
            const isChecked = /- \[x\] /i.test(line);
            const taskText = line.replace(/^- \[( |x)\] /i, '');
            return (
              <div
                key={idx}
                className={`notion-checklist-item ${isChecked ? 'completed' : ''}`}
                onClick={() => {
                  const newLines = [...lines];
                  newLines[idx] = isChecked ? `- [ ] ${taskText}` : `- [x] ${taskText}`;
                  handleContentChange(newLines.join('\n'));
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="notion-checkbox"
                />
                <span style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-muted)' : 'inherit' }}>
                  {taskText}
                </span>
              </div>
            );
          }
          // 5. Callouts / Citações (> 💡 ...)
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="notion-callout">
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          // 6. Linha horizontal
          if (line.trim() === '---') {
            return <hr key={idx} className="notion-divider" />;
          }
          // 7. Lista não-ordenada (- ...)
          if (line.startsWith('- ')) {
            return (
              <li key={idx} className="notion-bullet-item">
                {line.replace('- ', '')}
              </li>
            );
          }
          // 8. Linhas vazias
          if (!line.trim()) {
            return <div key={idx} style={{ height: '0.75rem' }} />;
          }

          // Parágrafo padrão
          return (
            <p key={idx} className="notion-p">
              {line}
            </p>
          );
        })}
      </div>
    );
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
        <div className="notion-toolbar">
          <div className="notion-tool-group">
            <button
              className="notion-tool-btn"
              title="Título Grande (H1)"
              onClick={() => insertTextAtCursor('# ', '\n', 'Título Principal')}
            >
              <Heading1 size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Subtítulo (H2)"
              onClick={() => insertTextAtCursor('## ', '\n', 'Subtítulo')}
            >
              <Heading2 size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Lista de Tarefas (Checklist)"
              onClick={() => insertTextAtCursor('- [ ] ', '\n', 'Nova tarefa')}
            >
              <CheckSquare size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Lista com Marcadores"
              onClick={() => insertTextAtCursor('- ', '\n', 'Item da lista')}
            >
              <List size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Lista Numerada"
              onClick={() => insertTextAtCursor('1. ', '\n', 'Primeiro passo')}
            >
              <ListOrdered size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Destaque / Callout"
              onClick={() => insertTextAtCursor('> 💡 *Destaque:* ', '\n', 'Escreva uma anotação importante aqui')}
            >
              <Quote size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Código"
              onClick={() => insertTextAtCursor('`', '`', 'codigo()')}
            >
              <Code size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Negrito"
              onClick={() => insertTextAtCursor('**', '**', 'negrito')}
            >
              <Bold size={16} />
            </button>
            <button
              className="notion-tool-btn"
              title="Itálico"
              onClick={() => insertTextAtCursor('*', '*', 'itálico')}
            >
              <Italic size={16} />
            </button>
          </div>

          {/* Alternador de Visualização */}
          <div className="notion-view-selector">
            <button
              className={`notion-view-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setViewMode('edit')}
              title="Apenas Editor"
            >
              <Edit3 size={15} />
            </button>
            <button
              className={`notion-view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Lado a Lado (Split)"
            >
              <Columns size={15} />
            </button>
            <button
              className={`notion-view-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Visualização Final"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>

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
              {renderMarkdown(content)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
