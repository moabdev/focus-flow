import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, FileText } from 'lucide-react';
import { storageService } from '../services/storage';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(storageService.getScratchpad());
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsSaved(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      await storageService.saveScratchpad(val);
      setIsSaved(true);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <aside className="scratchpad-drawer" aria-label="Notas Rápidas">
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" />
          <h3 className="modal-title">Notas Rápidas (Scratchpad)</h3>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          title="Fechar gaveta (Esc)"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '0.75rem 1.25rem 0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Anote insights, dúvidas ou fórmulas durante o foco sem quebrar o seu estado de concentração.
      </div>

      <textarea
        className="scratchpad-textarea"
        placeholder="Digite suas anotações aqui..."
        value={content}
        onChange={handleChange}
        autoFocus
      />

      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-glass-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <CheckCircle2 size={14} color={isSaved ? '#10b981' : 'var(--text-muted)'} />
          {isSaved ? 'Salvo automaticamente' : 'Salvando alterações...'}
        </span>
        <span>{content.length} caracteres</span>
      </div>
    </aside>
  );
};
