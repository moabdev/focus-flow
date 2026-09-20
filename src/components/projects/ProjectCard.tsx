import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '../../types';
import { SubtaskItem, formatSeconds } from './SubtaskItem';

interface ProjectCardProps {
  project: Project;
  projectSubtasks: Subtask[];
  visibleSubtasks: Subtask[];
  activeSubtaskId: string | null;
  onSelectActiveSubtask: (id: string) => void;
  onOpenTimerTab?: () => void;
  onOpenProjectDetail?: (id: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onCreateSubtask: (
    projectId: string,
    title: string,
    discipline: string,
    estimated: number,
    priority: PriorityLevel,
    notes?: string,
    due_date?: string
  ) => Promise<Subtask | null>;
  onDeleteSubtask: (id: string) => void;
  onToggleSubtaskCompleted: (id: string) => void;
  onOpenNotes: (subtask: Subtask) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  projectSubtasks,
  visibleSubtasks,
  activeSubtaskId,
  onSelectActiveSubtask,
  onOpenTimerTab,
  onOpenProjectDetail,
  onEditProject,
  onDeleteProject,
  onCreateSubtask,
  onDeleteSubtask,
  onToggleSubtaskCompleted,
  onOpenNotes,
}) => {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskEstimated, setSubtaskEstimated] = useState(2);
  const [subtaskPriority, setSubtaskPriority] = useState<PriorityLevel>('media');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');

  const completedCount = projectSubtasks.filter((s) => s.is_completed).length;
  const progressPercent =
    projectSubtasks.length > 0
      ? Math.round((completedCount / projectSubtasks.length) * 100)
      : 0;

  const handleCreateSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    await onCreateSubtask(
      project.id,
      subtaskTitle,
      'Geral',
      subtaskEstimated,
      subtaskPriority,
      '',
      subtaskDueDate || undefined
    );

    setSubtaskTitle('');
    setSubtaskEstimated(2);
    setSubtaskPriority('media');
    setSubtaskDueDate('');
    setIsAddingSubtask(false);
  };

  return (
    <div
      className="project-card glass-panel"
      style={{ borderTop: `4px solid ${project.color}` }}
    >
      {/* Header do Card do Projeto */}
      <div className="project-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            className="project-icon-badge"
            style={{ backgroundColor: `${project.color}25`, borderColor: project.color }}
          >
            {project.icon || '📁'}
          </span>
          <div
            onClick={() => onOpenProjectDetail && onOpenProjectDetail(project.id)}
            style={{ cursor: onOpenProjectDetail ? 'pointer' : 'default' }}
            title={onOpenProjectDetail ? 'Ver página do projeto' : undefined}
          >
            <h3 className="project-card-title">{project.title}</h3>
            {project.description && (
              <p className="project-card-desc">{project.description}</p>
            )}
          </div>
        </div>

        <div className="project-card-actions">
          {onOpenProjectDetail && (
            <button
              className="icon-btn"
              onClick={() => onOpenProjectDetail(project.id)}
              title="Abrir página individual do projeto"
              aria-label="Abrir página individual do projeto"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            className="icon-btn"
            onClick={() => onEditProject(project)}
            title="Editar Projeto"
            aria-label="Editar Projeto"
          >
            <Edit size={14} />
          </button>
          <button
            className="icon-btn text-danger"
            onClick={() => {
              if (
                confirm(
                  `Deseja realmente excluir o projeto "${project.title}" e todas as suas subtasks?`
                )
              ) {
                onDeleteProject(project.id);
              }
            }}
            title="Excluir Projeto"
            aria-label="Excluir Projeto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Metadados do Projeto */}
      <div className="project-card-meta">
        {(project.start_date || project.end_date) && (
          <div className="meta-item">
            <Calendar size={13} />
            <span>
              {project.start_date || 'Início'} ➔ {project.end_date || 'Sem prazo'}
            </span>
          </div>
        )}

        <div className="meta-item time-badge" style={{ color: project.color }}>
          <Clock size={13} />
          <strong>Tempo Total: {formatSeconds(project.total_elapsed_seconds || 0)}</strong>
        </div>
      </div>

      {/* Barra de Progresso das Subtarefas */}
      <div className="project-progress-wrapper">
        <div className="progress-label">
          <span>Progresso ({completedCount}/{projectSubtasks.length} concluídas)</span>
          <span style={{ fontWeight: 700 }}>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: project.color,
              boxShadow: `0 0 10px ${project.color}80`,
            }}
          />
        </div>
      </div>

      {/* Subtarefas do Projeto */}
      <div className="subtasks-container">
        <div className="subtasks-section-title">
          <span>Subtarefas ({visibleSubtasks.length})</span>
          <button
            className="add-subtask-quick-btn"
            onClick={() => setIsAddingSubtask(!isAddingSubtask)}
          >
            <Plus size={14} /> Adicionar Subtask
          </button>
        </div>

        {/* Formulário Rápido de Criação de Subtask */}
        {isAddingSubtask && (
          <form onSubmit={handleCreateSubtaskSubmit} className="add-subtask-form glass-panel">
            <input
              type="text"
              placeholder="Nome da subtarefa..."
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              autoFocus
              required
            />

            <div className="subtask-form-controls">
              <div className="form-mini-group">
                <label>Pomodoros Est.:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={subtaskEstimated}
                  onChange={(e) => setSubtaskEstimated(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-mini-group">
                <label>Prioridade:</label>
                <select
                  value={subtaskPriority}
                  onChange={(e) => setSubtaskPriority(e.target.value as PriorityLevel)}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="form-mini-group">
                <label>Prazo:</label>
                <input
                  type="date"
                  value={subtaskDueDate}
                  onChange={(e) => setSubtaskDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => setIsAddingSubtask(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="filter-chip"
                  style={{ background: 'var(--accent-primary)', color: '#fff' }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Itens de Subtask */}
        <div className="subtasks-list">
          {visibleSubtasks.length === 0 ? (
            <div className="empty-subtasks-note">
              Nenhuma subtarefa neste projeto ainda.
            </div>
          ) : (
            visibleSubtasks.map((sub) => (
              <SubtaskItem
                key={sub.id}
                subtask={sub}
                isCurrentActive={activeSubtaskId === sub.id}
                onToggleCompleted={onToggleSubtaskCompleted}
                onSelectActiveSubtask={onSelectActiveSubtask}
                onOpenTimerTab={onOpenTimerTab}
                onOpenNotes={onOpenNotes}
                onDeleteSubtask={onDeleteSubtask}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
