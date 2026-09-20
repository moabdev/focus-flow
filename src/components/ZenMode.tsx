import React from 'react';
import { Play, Pause, Minimize2, Volume2, VolumeX, Target } from 'lucide-react';
import { Task, AmbientSound } from '../types';

interface ZenModeProps {
  isOpen: boolean;
  onExit: () => void;
  formattedTime: string;
  progressPercent: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  activeTask: Task | null;
  quoteText: string;
  ambientSound: AmbientSound;
  onToggleAmbient: () => void;
}

export const ZenMode: React.FC<ZenModeProps> = ({
  isOpen,
  onExit,
  formattedTime,
  progressPercent,
  isRunning,
  onToggleTimer,
  activeTask,
  quoteText,
  ambientSound,
  onToggleAmbient,
}) => {
  if (!isOpen) return null;

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="zen-overlay">
      <div className="zen-breathing-aura" />

      {/* Botão Sair no Topo */}
      <button
        className="icon-btn"
        onClick={onExit}
        title="Sair do Modo Zen (Esc)"
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <Minimize2 size={20} />
      </button>

      {/* Meta em Foco */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 10 }}>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          <Target size={20} color="var(--accent-primary)" />
          <span>{activeTask ? activeTask.title : 'Foco & Aprendizado Profundo'}</span>
        </div>
      </div>

      {/* Timer Circular Central */}
      <div
        className="timer-circle-wrap"
        style={{ width: '360px', height: '360px', zIndex: 10, cursor: 'pointer' }}
        onClick={onToggleTimer}
        title="Clique para pausar/iniciar"
      >
        <svg className="timer-svg" viewBox="0 0 360 360">
          <circle
            className="timer-bg-ring"
            cx="180"
            cy="180"
            r={radius}
            strokeWidth={6}
          />
          <circle
            className="timer-progress-ring"
            cx="180"
            cy="180"
            r={radius}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="timer-digits-container">
          <div className="timer-digits" style={{ fontSize: '5rem' }}>
            {formattedTime}
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            <span>{isRunning ? 'Em Andamento' : 'Pausado'}</span>
          </div>
        </div>
      </div>

      {/* Frase / Mantra Inferior */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', maxWidth: '520px', zIndex: 10 }}>
        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          &ldquo;{quoteText}&rdquo;
        </p>
      </div>

      {/* Indicador de Som Ambiente no Canto */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        onClick={onToggleAmbient}
        title="Alternar áudio de chuva"
      >
        {ambientSound !== 'none' ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} />}
        <span>{ambientSound !== 'none' ? 'Som Ambiente Ativo' : 'Som Ambiente Mudo'}</span>
      </div>
    </div>
  );
};
