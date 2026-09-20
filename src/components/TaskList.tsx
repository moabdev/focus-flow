import React, { useState } from 'react';
import { Plus, Check, Trash2, Tag } from 'lucide-react';
import { Task, PriorityLevel } from '../types';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectActiveTask: (id: string) => void;
  onToggleTaskCompleted: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, discipline: string, estimated: number, priority: PriorityLevel) => void;
  disciplines: string[];
  filterDiscipline: string;
  onSelectFilterDiscipline: (disc: string) => void;
  filterStatus: 'todas' | 'pendentes' | 'concluidas';
  onSelectFilterStatus: (status: 'todas' | 'pendentes' | 'concluidas') => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onSelectActiveTask,
  onToggleTaskCompleted,
  onDeleteTask,
  onAddTask,
  disciplines,
  filterDiscipline,
  onSelectFilterDiscipline,
  filterStatus,
  onSelectFilterStatus,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [newEstimated, setNewEstimated] = useState(2);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('media');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddTask(newTitle, newDiscipline || 'Geral', newEstimated, newPriority);
      setNewTitle('');
      setNewDiscipline('');
      setNewEstimated(2);
      setNewPriority('media');
      setIsAdding(false);
    }
  };

  return (
    <section className="tasks-section" id="tasks-container" aria-label="Tarefas e Disciplinas">
      <div className="tasks-header">
        <h2 className="tasks-title">Tarefas & Disciplinas</h2>

        <div className="task-filter-chips">
          <button
            className={`filter-chip ${filterStatus === 'todas' && filterDiscipline === 'todas' ? 'active' : ''}`}
            onClick={() => {
              onSelectFilterStatus('todas');
              onSelectFilterDiscipline('todas');
            }}
          >
            Todas
          </button>
          <button
            className={`filter-chip ${filterStatus === 'pendentes' ? 'active' : ''}`}
            onClick={() => onSelectFilterStatus('pendentes')}
          >
            Pendentes
          </button>
          <button
            className={`filter-chip ${filterStatus === 'concluidas' ? 'active' : ''}`}
            onClick={() => onSelectFilterStatus('concluidas')}
          >
            Concluídas
          </button>

          {disciplines.map((disc) => (
            <button
              key={disc}
              className={`filter-chip ${filterDiscipline === disc ? 'active' : ''}`}
              onClick={() => onSelectFilterDiscipline(disc)}
            >
              #{disc}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário de Adicionar Tarefa */}
      {isAdding ? (
        <form onSubmit={handleCreateTask} className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <input
              type="text"
              placeholder="O que você vai estudar agora?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Disciplina (ex: Python, Java, Matemática)"
                value={newDiscipline}
                onChange={(e) => setNewDiscipline(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-glass-subtle)',
                  color: 'var(--text-primary)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimativa (pomos):</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newEstimated}
                  onChange={(e) => setNewEstimated(parseInt(e.target.value) || 1)}
                  style={{
                    width: '60px',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {(['baixa', 'media', 'alta'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      border: newPriority === p ? '2px solid #fff' : '1px solid transparent',
                      background:
                        p === 'alta'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : p === 'media'
                          ? 'rgba(245, 158, 11, 0.3)'
                          : 'rgba(16, 185, 129, 0.3)',
                      color:
                        p === 'alta'
                          ? '#ef4444'
                          : p === 'media'
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                style={{ padding: '0.6rem 1.25rem', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="main-start-btn"
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
              >
                Salvar Tarefa
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          className="add-task-bar-btn"
          onClick={() => setIsAdding(true)}
          data-testid="add-task-btn"
        >
          <Plus size={20} />
          <span>Adicionar Tarefa de Estudo</span>
        </button>
      )}

      {/* Lista de Tarefas */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Nenhuma tarefa encontrada neste filtro.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.id === activeTaskId ? 'active-task-item' : ''} ${task.is_completed ? 'completed' : ''}`}
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
          ))
        )}
      </div>
    </section>
  );
};
