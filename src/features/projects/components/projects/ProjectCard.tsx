import React, { useState } from 'react';
import { Calendar, Clock, Plus, ExternalLink, ChevronDown } from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '@/features/core/types';
import { SubtaskItem, formatSeconds } from './SubtaskItem';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';
import { CreateSubtaskForm } from './CreateSubtaskForm';
import { ProjectCardHeader } from './ProjectCardHeader';

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

  const completedCount = projectSubtasks.filter((s) => s.is_completed).length;
  const progressPercent =
    projectSubtasks.length > 0
      ? Math.round((completedCount / projectSubtasks.length) * 100)
      : 0;

  const handleCreateSubtaskSubmit = async (title: string, estimated: number, priority: PriorityLevel, dueDate: string) => {
    await onCreateSubtask(
      project.id,
      title,
      'Geral',
      estimated,
      priority,
      '',
      dueDate || undefined
    );
    setIsAddingSubtask(false);
  };

  return (
    <div
      className="project-card glass-panel"
      style={{ borderLeft: `4px solid ${project.color || 'var(--accent-primary)'}` }}
    >
      <ProjectCardHeader
        project={project}
        onOpenProjectDetail={onOpenProjectDetail}
        onEditProject={onEditProject}
        onDeleteProject={() => setIsDeleteModalOpen(true)}
      />

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

      {isExpanded && (
        <div className="subtasks-collapsible">
          {isAddingSubtask && (
            <CreateSubtaskForm
              onSubmit={handleCreateSubtaskSubmit}
              onCancel={() => setIsAddingSubtask(false)}
            />
          )}

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
