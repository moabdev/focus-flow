import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Target, Clock } from 'lucide-react';
import { TimerMode, Task, Subtask, Project } from '../types';

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
  activeTask: Task | Subtask | null;
  activeProject?: Project | null;
  onOpenTasksScroll: () => void;
}

export const TimerCard: React.FC<TimerCardProps> = React.memo(({
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
  activeProject,
  onOpenTasksScroll,
}) => {
  // Parâmetros do anel SVG
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const formatSeconds = (totalSecs?: number) => {
    if (!totalSecs || totalSecs <= 0) return '0 min';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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

        {/* Display Central do Tempo */}
        <div className="timer-digits-container">
          <span className="timer-digits" data-testid="timer-display">
            {formattedTime}
          </span>
          <span className="timer-mode-label">
            {mode === 'pomodoro' ? 'Foco Produtivo' : mode === 'shortBreak' ? 'Pausa Curta' : 'Descanso Longo'}
          </span>
          {mode === 'pomodoro' && (
            <span className="timer-cycle-badge">
              Ciclo #{cycleCount + 1}
            </span>
          )}
        </div>
      </div>

      {/* Controles Principais */}
      <div className="timer-controls">
        <button
          className="secondary-control-btn"
          onClick={onReset}
          title="Reiniciar tempo atual (Alt + R)"
          aria-label="Reiniciar cronômetro"
        >
          <RotateCcw size={20} />
        </button>

        <button
          className={`main-start-btn ${isRunning ? 'running' : ''}`}
          onClick={onToggle}
          aria-label={isRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
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
          title="Clique para ir até as tarefas"
        >
          <Target size={16} color="var(--accent-primary)" />
          {activeProject && (
            <span
              className="discipline-tag"
              style={{
                backgroundColor: `${activeProject.color}25`,
                borderColor: `${activeProject.color}50`,
                color: activeProject.color,
                marginRight: '0.35rem',
              }}
            >
              {activeProject.icon || '📁'} {activeProject.title}
            </span>
          )}
          <span>Foco Atual: <strong>{activeTask.title}</strong></span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span className="subtask-elapsed-badge" style={{ fontSize: '0.8rem' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
            {formatSeconds(activeTask.elapsed_seconds)}
          </span>
          <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
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
});
