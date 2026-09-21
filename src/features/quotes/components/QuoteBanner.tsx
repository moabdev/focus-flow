import React, { useState } from 'react';
import { RotateCw, PlusCircle, Sparkles } from 'lucide-react';
import { Quote } from '@/features/core/types';

interface QuoteBannerProps {
  quote: Quote;
  onRefreshQuote: () => void;
  onAddMantra: (text: string) => void;
  isRotating: boolean;
}

export const QuoteBanner: React.FC<QuoteBannerProps> = ({
  quote,
  onRefreshQuote,
  onAddMantra,
  isRotating,
}) => {
  const [showMantraInput, setShowMantraInput] = useState(false);
  const [mantraText, setMantraText] = useState('');

  const handleSaveMantra = (e: React.FormEvent) => {
    e.preventDefault();
    if (mantraText.trim()) {
      onAddMantra(mantraText.trim());
      setMantraText('');
      setShowMantraInput(false);
    }
  };

  return (
    <section className="quote-banner glass-panel" aria-label="Frase Motivacional">
      <div style={{ opacity: isRotating ? 0.3 : 1, transition: 'opacity 0.25s ease' }}>
        <p className="quote-text">
          &ldquo;{quote.text}&rdquo;
        </p>
        <div className="quote-meta">
          <span>— {quote.author}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ textTransform: 'capitalize', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {quote.isMantra ? '🌟 Mantra Pessoal' : quote.category}
          </span>
          <button
            className="refresh-quote-btn"
            onClick={onRefreshQuote}
            title="Sortear outra frase motivacional"
          >
            <RotateCw size={12} style={{ animation: isRotating ? 'spin 0.5s linear' : 'none' }} />
            <span>Nova Frase</span>
          </button>
          <button
            className="refresh-quote-btn"
            onClick={() => setShowMantraInput(true)}
            title="Criar meu próprio mantra ou meta de estudo"
          >
            <PlusCircle size={12} />
            <span>Meu Mantra</span>
          </button>
        </div>
      </div>

      {showMantraInput && (
        <form
          onSubmit={handleSaveMantra}
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Ex: Aprovação no Concurso 2026 / Vaga Tech"
            value={mantraText}
            onChange={(e) => setMantraText(e.target.value)}
            autoFocus
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--text-primary)',
              width: '100%',
              maxWidth: '380px',
            }}
          />
          <button
            type="submit"
            className="main-start-btn"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} /> Salvar
          </button>
          <button
            type="button"
            onClick={() => setShowMantraInput(false)}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.45rem' }}
          >
            Cancelar
          </button>
        </form>
      )}
    </section>
  );
};
