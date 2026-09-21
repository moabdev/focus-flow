import React from 'react';
import { Upload, Download } from 'lucide-react';

export interface DeckImportExportTabProps {
  importText: string;
  setImportText: (val: string) => void;
  importFeedback: string | null;
  onExecuteImport: () => void;
  onExportClick: () => void;
}

export const DeckImportExportTab: React.FC<DeckImportExportTabProps> = ({
  importText,
  setImportText,
  importFeedback,
  onExecuteImport,
  onExportClick,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
          Importar em Lote (Texto ou CSV)
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Cole seus cartões abaixo. Formato aceito: <code>Pergunta;Resposta;Dica (opcional)</code>, uma linha por cartão.
        </p>
      </div>

      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Pergunta 1;Resposta detalhada 1;Dica 1&#10;Pergunta 2;Resposta detalhada 2"
        rows={6}
        className="mindmap-node-input"
        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
      />

      {importFeedback && (
        <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
          {importFeedback}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="btn-study-deck"
          onClick={onExecuteImport}
          disabled={!importText.trim()}
          style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
        >
          <Upload size={16} /> Importar Cartões
        </button>

        <button
          className="btn-study-deck"
          onClick={onExportClick}
          style={{ width: 'auto', padding: '0.5rem 1.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <Download size={16} /> Exportar Baralho (JSON)
        </button>
      </div>
    </div>
  );
};
