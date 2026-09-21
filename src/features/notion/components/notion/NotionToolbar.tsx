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
