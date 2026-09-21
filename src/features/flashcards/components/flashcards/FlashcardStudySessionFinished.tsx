import React from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import { FlashcardDeck } from '@/features/core/types';

interface FlashcardStudySessionFinishedProps {
  totalInSession: number;
  retentionRate: number;
  sessionStats: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  deck: FlashcardDeck;
  onClose: () => void;
  onStartPomodoroForDeck?: (deck: FlashcardDeck) => void;
}

export const FlashcardStudySessionFinished: React.FC<FlashcardStudySessionFinishedProps> = ({
  totalInSession,
  retentionRate,
  sessionStats,
  deck,
  onClose,
  onStartPomodoroForDeck,
}) => {
  return (
    <div className="study-finished-view">
      <div className="study-trophy-icon">🏆</div>
      <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Sessão de Revisão Concluída!</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>
        Excelente esforço! Você reforçou sua memória de longo prazo com repetição espaçada.
      </p>

      <div className="study-finished-stats">
        <div className="finished-stat-box">
          <div className="finished-stat-val">{totalInSession}</div>
          <div className="finished-stat-lbl">Cartões Revisados</div>
        </div>

        <div className="finished-stat-box">
          <div className="finished-stat-val" style={{ color: '#10b981' }}>
            {retentionRate}%
          </div>
          <div className="finished-stat-lbl">Taxa de Acertos</div>
        </div>

        <div className="finished-stat-box">
          <div className="finished-stat-val" style={{ color: '#0ea5e9' }}>
            {sessionStats.good + sessionStats.easy}
          </div>
          <div className="finished-stat-lbl">Memorizados</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '480px' }}>
        {onStartPomodoroForDeck && (
          <button
            className="btn-study-deck"
            style={{ background: 'var(--accent-secondary, #0ea5e9)' }}
            onClick={() => {
              onClose();
              onStartPomodoroForDeck(deck);
            }}
          >
            <Play size={16} /> Focar no Pomodoro
          </button>
        )}

        <button className="btn-study-deck" onClick={onClose}>
          <CheckCircle2 size={16} /> Concluir
        </button>
      </div>
    </div>
  );
};
