import React from 'react';
import {
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
  Mic,
  MicOff,
} from 'lucide-react';

interface NotionToolbarProps {
  onInsertText: (prefix: string, suffix?: string, placeholder?: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  isListening?: boolean;
  onToggleSpeech?: () => void;
  isSpeechSupported?: boolean;
}

export const NotionToolbar: React.FC<NotionToolbarProps> = ({
  onInsertText,
  viewMode,
  setViewMode,
  isListening = false,
  onToggleSpeech,
  isSpeechSupported = true,
}) => {
  return (
    <div className="notion-toolbar">
      <div className="notion-tool-group">
        <button
          className="notion-tool-btn"
          title="Título Grande (H1)"
          onClick={() => onInsertText('# ', '\n', 'Título Principal')}
        >
          <Heading1 size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Subtítulo (H2)"
          onClick={() => onInsertText('## ', '\n', 'Subtítulo')}
        >
          <Heading2 size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Lista de Tarefas (Checklist)"
          onClick={() => onInsertText('- [ ] ', '\n', 'Nova tarefa')}
        >
          <CheckSquare size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Lista com Marcadores"
          onClick={() => onInsertText('- ', '\n', 'Item da lista')}
        >
          <List size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Lista Numerada"
          onClick={() => onInsertText('1. ', '\n', 'Primeiro passo')}
        >
          <ListOrdered size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Destaque / Callout"
          onClick={() => onInsertText('> 💡 *Destaque:* ', '\n', 'Escreva uma anotação importante aqui')}
        >
          <Quote size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Código"
          onClick={() => onInsertText('`', '`', 'codigo()')}
        >
          <Code size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Negrito"
          onClick={() => onInsertText('**', '**', 'negrito')}
        >
          <Bold size={16} />
        </button>
        <button
          className="notion-tool-btn"
          title="Itálico"
          onClick={() => onInsertText('*', '*', 'itálico')}
        >
          <Italic size={16} />
        </button>

        {/* Ditado por Voz / Transcrição */}
        {onToggleSpeech && (
          <button
            type="button"
            className={`notion-tool-btn notion-mic-btn ${isListening ? 'listening' : ''}`}
            title={
              !isSpeechSupported
                ? 'Ditado por voz não suportado neste navegador'
                : isListening
                ? 'Parar Gravação (Gravando...)'
                : 'Ditado por Voz / Transcrever Notas (Alt+D)'
            }
            onClick={onToggleSpeech}
            aria-label="Ditado por voz"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {/* Gerar Flashcards via IA */}
        <button
          type="button"
          className="notion-tool-btn notion-ai-btn"
          title="Gerar Flashcards com IA ✨"
          onClick={() => {
            const ev = new CustomEvent('generate-ai-flashcards');
            window.dispatchEvent(ev);
          }}
          aria-label="Gerar Flashcards"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-primary)' }}
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/>
            <path d="M19 17v4"/>
            <path d="M3 5h4"/>
            <path d="M17 19h4"/>
          </svg>
        </button>

        {/* Gerar Quiz via IA */}
        <button
          type="button"
          className="notion-tool-btn notion-ai-btn"
          title="Gerar Quiz com IA 📝"
          onClick={() => {
            const ev = new CustomEvent('generate-ai-quiz');
            window.dispatchEvent(ev);
          }}
          aria-label="Gerar Quiz"
          style={{ marginLeft: '4px' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-primary)' }}
          >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-3.18-2.7V14a3 3 0 0 1 1.4-2.54 3 3 0 0 1-1.4-2.54V8.9A3 3 0 0 1 4.08 6.2 2.5 2.5 0 0 1 7.04 3.12 2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 3.18-2.7V14a3 3 0 0 0-1.4-2.54 3 3 0 0 0 1.4-2.54V8.9a3 3 0 0 0-3.18-2.7 2.5 2.5 0 0 0-2.96-3.08A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
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
  );
};
