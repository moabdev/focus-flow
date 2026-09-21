import React from 'react';
import { Check, Trash2, Tag } from 'lucide-react';
import { Task } from '@/features/core/types';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onSelectActiveTask: (id: string) => void;
  onToggleTaskCompleted: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isActive,
  onSelectActiveTask,
  onToggleTaskCompleted,
  onDeleteTask,
}) => {
  return (
    <div
      className={`task-item ${isActive ? 'active-task-item' : ''} ${task.is_completed ? 'completed' : ''}`}
    >
      <div className="task-item-left">
        <button
          className={`task-check-btn ${task.is_completed ? 'checked' : ''}`}
          onClick={() => onToggleTaskCompleted(task.id)}
          title={task.is_completed ? 'Reabrir tarefa' : 'Marcar como concluída'}
          aria-label="Concluir tarefa"
        >
          {task.is_completed && <Check size={16} strokeWidth={3} />}
        </button>

        <div
          className="task-details"
          onClick={() => onSelectActiveTask(task.id)}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          <span className="task-title-text">{task.title}</span>
          <div className="task-tags">
            <span className="discipline-tag">
              <Tag size={10} style={{ display: 'inline', marginRight: '3px' }} />
              {task.discipline}
            </span>
            <span className={`priority-badge priority-${task.priority}`}>
              {task.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="task-item-right">
        <div className="pomodoro-dots-counter" title={`${task.pomodoros_completed} de ${task.pomodoros_estimated} ciclos concluídos`}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {task.pomodoros_completed}/{task.pomodoros_estimated}
          </span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {Array.from({ length: Math.max(task.pomodoros_estimated, task.pomodoros_completed) }).map((_, i) => (
              <div
                key={i}
                className={`pomo-dot ${i < task.pomodoros_completed ? 'done' : ''}`}
              />
            ))}
          </div>
        </div>

        <button
          className="icon-btn"
          style={{ width: '32px', height: '32px' }}
          onClick={() => onDeleteTask(task.id)}
          title="Excluir tarefa"
          aria-label="Excluir"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
