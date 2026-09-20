import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Target } from 'lucide-react';
import { TimerMode, Task } from '../types';

interface TimerCardProps {
  mode: TimerMode;
  onChangeMode: (mode: TimerMode) => void;
  formattedTime: string;
  progressPercent: number;
  isRunning: boolean;
  cycleCount: number;
  onToggle: () => void;
  onSkip: () => void;
  onReset: () => void;
  activeTask: Task | null;
  onOpenTasksScroll: () => void;
}

export const TimerCard: React.FC<TimerCardProps> = ({
  mode,
  onChangeMode,
  formattedTime,
  progressPercent,
  isRunning,
  cycleCount,
  onToggle,
  onSkip,
  onReset,
  activeTask,
  onOpenTasksScroll,
}) => {
  // Parâmetros do anel SVG
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="timer-card glass-panel" aria-label="Cronômetro Pomodoro">
      {/* Seletores de Modo */}
      <div className="mode-selectors">
        <button
          className={`mode-pill ${mode === 'pomodoro' ? 'active' : ''}`}
          onClick={() => onChangeMode('pomodoro')}
        >
          Pomodoro
        </button>
        <button
          className={`mode-pill ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => onChangeMode('shortBreak')}
        >
          Pausa Curta
        </button>
        <button
          className={`mode-pill ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => onChangeMode('longBreak')}
        >
          Pausa Longa
        </button>
      </div>

      {/* Anel Circular SVG */}
      <div className="timer-circle-wrap">
        <svg className="timer-svg" viewBox="0 0 320 320">
          <circle
            className="timer-bg-ring"
            cx="160"
            cy="160"
            r={radius}
          />
          <circle
            className="timer-progress-ring"
            cx="160"
            cy="160"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="timer-digits-container">
          <div className="timer-digits" data-testid="timer-display">
            {formattedTime}
          </div>
          <div className="timer-cycle-label">
            {mode === 'pomodoro' ? `Ciclo de Foco #${cycleCount + 1}` : 'Momento de Pausa'}
          </div>
        </div>
      </div>

      {/* Controles do Timer */}
      <div className="timer-controls">
        <button
          className="secondary-control-btn"
          onClick={onReset}
          title="Reiniciar tempo atual (Alt + R)"
          aria-label="Reiniciar"
        >
          <RotateCcw size={20} />
        </button>

        <button
          className="main-start-btn"
          onClick={onToggle}
          title="Iniciar ou Pausar (Barra de Espaço)"
          data-testid="timer-start-btn"
        >
          {isRunning ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pause size={22} /> Pausar
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={22} fill="currentColor" /> Iniciar
            </span>
          )}
        </button>

        <button
          className="secondary-control-btn"
          onClick={onSkip}
          title="Pular para o próximo ciclo (Alt + S)"
          aria-label="Pular ciclo"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Tarefa Ativa em Foco */}
      {activeTask ? (
        <div
          className="active-task-banner"
          onClick={onOpenTasksScroll}
          style={{ cursor: 'pointer' }}
          title="Clique para ir até a lista de tarefas"
        >
          <Target size={16} color="var(--accent-primary)" />
          <span>Foco Atual: <strong>{activeTask.title}</strong></span>
          <span style={{ opacity: 0.5 }}>|</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: Math.max(activeTask.pomodoros_estimated, activeTask.pomodoros_completed) }).map((_, i) => (
              <div
                key={i}
                className={`pomo-dot ${i < activeTask.pomodoros_completed ? 'done' : ''}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="active-task-banner"
          onClick={onOpenTasksScroll}
          style={{ cursor: 'pointer', opacity: 0.7 }}
        >
          <span>Nenhuma tarefa selecionada no momento. Clique para escolher.</span>
        </div>
      )}
    </div>
  );
};
