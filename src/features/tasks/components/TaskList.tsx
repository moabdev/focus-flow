import '../styles/tasks.css';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, PriorityLevel } from '@/features/core/types';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';

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

      {isAdding ? (
        <TaskForm
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDiscipline={newDiscipline}
          setNewDiscipline={setNewDiscipline}
          newEstimated={newEstimated}
          setNewEstimated={setNewEstimated}
          newPriority={newPriority}
          setNewPriority={setNewPriority}
          onSubmit={handleCreateTask}
          onCancel={() => setIsAdding(false)}
        />
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

      <div className="task-list">
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Nenhuma tarefa encontrada neste filtro.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onSelectActiveTask={onSelectActiveTask}
              onToggleTaskCompleted={onToggleTaskCompleted}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </section>
  );
};

