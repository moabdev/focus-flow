import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, Plus, ExternalLink, ChevronDown } from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '../../types';
import { SubtaskItem, formatSeconds } from './SubtaskItem';
import { CustomSelect, SelectOption } from '../common/CustomSelect';
import { ConfirmModal } from '../common/ConfirmModal';

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'baixa', label: 'Baixa', badgeColor: '#10b981' },
  { value: 'media', label: 'Média', badgeColor: '#f59e0b' },
  { value: 'alta', label: 'Alta', badgeColor: '#ff2a5f' },
];

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

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
      style={{ borderLeft: `4px solid ${project.color || 'var(--accent-primary)'}` }}
    >
      {/* Header do Card do Projeto */}
      <div className="project-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <span
            className="project-icon-badge"
            style={{
              backgroundColor: `${project.color || 'var(--accent-primary)'}18`,
              borderColor: `${project.color || 'var(--accent-primary)'}35`,
            }}
          >
            {project.icon || '📁'}
          </span>
          <div
            className="project-title-wrap"
            onClick={() => onOpenProjectDetail && onOpenProjectDetail(project.id)}
            style={{ cursor: onOpenProjectDetail ? 'pointer' : 'default', minWidth: 0, flex: 1 }}
            title={onOpenProjectDetail ? 'Abrir detalhes do projeto' : undefined}
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
              title="Abrir página do projeto"
              aria-label="Abrir página do projeto"
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
            onClick={() => setIsDeleteModalOpen(true)}
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
            <Calendar size={12} />
            <span>
              {project.start_date || 'Início'} ➔ {project.end_date || 'Sem prazo'}
            </span>
          </div>
        )}

        <div className="meta-item time-badge" style={{ color: project.color }}>
          <Clock size={12} />
          <span>{formatSeconds(project.total_elapsed_seconds || 0)}</span>
        </div>

        <div className="meta-item">
          <span>
            {completedCount}/{projectSubtasks.length} concluídas ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Barra de Progresso das Subtarefas */}
      <div className="project-progress-wrapper">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: project.color,
              boxShadow: `0 0 8px ${project.color}60`,
            }}
          />
        </div>
      </div>

      {/* Rodapé: Toggle de Subtarefas e Ações Rápidas */}
      <div className="project-card-footer">
        <button
          type="button"
          className="subtasks-toggle-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? 'Ocultar subtarefas' : 'Expandir subtarefas'}
        >
          <span>
            {projectSubtasks.length === 0
              ? 'Subtarefas (0)'
              : `Subtarefas (${completedCount}/${projectSubtasks.length})`}
          </span>
          <ChevronDown
            size={14}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {onOpenProjectDetail && (
            <button
              type="button"
              className="project-open-detail-link"
              onClick={() => onOpenProjectDetail(project.id)}
            >
              Ver página <ExternalLink size={11} />
            </button>
          )}

          <button
            type="button"
            className="add-subtask-quick-btn"
            onClick={() => {
              setIsAddingSubtask((prev) => !prev);
              setIsExpanded(true);
            }}
          >
            <Plus size={13} /> Subtask
          </button>
        </div>
      </div>

      {/* Subtarefas do Projeto (Expansível) */}
      {isExpanded && (
        <div className="subtasks-collapsible">
          {/* Formulário Rápido de Criação de Subtask */}
          {isAddingSubtask && (
            <form onSubmit={handleCreateSubtaskSubmit} className="add-subtask-form inline-form">
              <input
                type="text"
                className="subtask-input"
                placeholder="Nome da subtarefa..."
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                autoFocus
                required
              />

              <div className="subtask-form-controls">
                <div className="form-mini-group">
                  <label>Pomodoros:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={subtaskEstimated}
                    onChange={(e) => setSubtaskEstimated(parseInt(e.target.value) || 1)}
                    style={{ width: '50px' }}
                  />
                </div>

                <div className="form-mini-group">
                  <label>Prioridade:</label>
                  <CustomSelect
                    value={subtaskPriority}
                    options={PRIORITY_OPTIONS}
                    onChange={(val) => setSubtaskPriority(val as PriorityLevel)}
                    style={{ minWidth: '110px' }}
                  />
                </div>

                <div className="form-mini-group">
                  <label>Prazo:</label>
                  <input
                    type="date"
                    value={subtaskDueDate}
                    onChange={(e) => setSubtaskDueDate(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setIsAddingSubtask(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Lista de Itens de Subtask */}
          <div className="subtasks-list">
            {visibleSubtasks.length === 0 ? (
              <div className="empty-subtasks-note">
                Nenhuma subtarefa encontrada neste projeto.
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
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Projeto"
        message={
          <>
            Tem certeza que deseja excluir o projeto <strong>"{project.title}"</strong> e todas as suas subtarefas? Essa ação não pode ser desfeita.
          </>
        }
        confirmText="Excluir Projeto"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteProject(project.id);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
});
