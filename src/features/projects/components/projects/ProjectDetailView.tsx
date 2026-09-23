import '../../styles/project-detail.css';
import React, { useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '@/features/core/types';
import { SubtaskItem } from './SubtaskItem';
import { NotionNoteEditor } from '@/features/notion/components/NotionNoteEditor';
import { ConfirmModal } from '@/features/core/components/common/ConfirmModal';
import { ProjectHeroCard } from './ProjectHeroCard';
import { ProjectDetailSubtaskForm } from './ProjectDetailSubtaskForm';

interface ProjectDetailViewProps {
  project: Project;
  subtasks: Subtask[];
  activeSubtaskId: string | null;
  onSelectActiveSubtask: (id: string) => void;
  onOpenTimerTab?: () => void;
  onBack: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => Promise<void>;
  onCreateSubtask: (
    projectId: string,
    title: string,
    discipline?: string,
    estimated?: number,
    priority?: PriorityLevel,
    notes?: string,
    due_date?: string
  ) => Promise<Subtask | null>;
  onUpdateSubtask?: (id: string, data: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onToggleSubtaskCompleted: (id: string) => Promise<void>;
  onOpenNotes?: (subtask: Subtask) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  subtasks,
  activeSubtaskId,
  onSelectActiveSubtask,
  onOpenTimerTab,
  onBack,
  onDeleteProject,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtaskCompleted,
  onOpenNotes,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingNotesSubtask, setEditingNotesSubtask] = useState<Subtask | null>(null);

  const projectSubtasks = subtasks.filter((s) => s.project_id === project.id);
  const completedCount = projectSubtasks.filter((s) => s.is_completed).length;
  const progressPercent = projectSubtasks.length > 0 ? Math.round((completedCount / projectSubtasks.length) * 100) : 0;
  const totalProjectTimeSpent = project.total_elapsed_seconds || projectSubtasks.reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0);

  const visibleSubtasks = projectSubtasks.filter((s) => {
    if (filterStatus === 'pendentes' && s.is_completed) return false;
    if (filterStatus === 'concluidas' && !s.is_completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.title.toLowerCase().includes(q) || (s.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateSubtaskSubmit = async (title: string, discipline: string, priority: PriorityLevel, estimated: number) => {
    await onCreateSubtask(project.id, title, discipline, estimated, priority);
    setIsAddingSubtask(false);
  };

  return (
    <div className="project-detail-container">
      <button className="project-detail-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar para Projetos
      </button>

      <ProjectHeroCard
        project={project}
        totalProjectTimeSpent={totalProjectTimeSpent}
        completedCount={completedCount}
        totalSubtasks={projectSubtasks.length}
        progressPercent={progressPercent}
        onOpenTimerTab={onOpenTimerTab}
        onDeleteProject={onDeleteProject ? () => setIsDeleteModalOpen(true) : undefined}
      />

      <div className="project-detail-subtasks-card glass-panel">
        <div className="project-subtasks-toolbar">
          <div className="project-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar subtarefas ou notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="project-filter-pills">
            <button
              className={`filter-pill ${filterStatus === 'todas' ? 'active' : ''}`}
              onClick={() => setFilterStatus('todas')}
            >
              Todas ({projectSubtasks.length})
            </button>
            <button
              className={`filter-pill ${filterStatus === 'pendentes' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pendentes')}
            >
              Pendentes ({projectSubtasks.length - completedCount})
            </button>
            <button
              className={`filter-pill ${filterStatus === 'concluidas' ? 'active' : ''}`}
              onClick={() => setFilterStatus('concluidas')}
            >
              Concluídas ({completedCount})
            </button>
          </div>

          <button
            className="add-subtask-quick-btn"
            onClick={() => setIsAddingSubtask(true)}
            title="Adicionar subtarefa"
          >
            <Plus size={16} /> Nova Subtarefa
          </button>
        </div>

        {isAddingSubtask && (
          <ProjectDetailSubtaskForm
            onSubmit={handleCreateSubtaskSubmit}
            onCancel={() => setIsAddingSubtask(false)}
          />
        )}

        <div className="project-subtasks-list">
          {visibleSubtasks.map((sub) => (
            <SubtaskItem
              key={sub.id}
              subtask={sub}
              isCurrentActive={activeSubtaskId === sub.id}
              onSelectActiveSubtask={onSelectActiveSubtask}
              onOpenTimerTab={onOpenTimerTab}
              onDeleteSubtask={onDeleteSubtask}
              onToggleCompleted={onToggleSubtaskCompleted}
              onOpenNotes={(task) => {
                if (onOpenNotes) {
                  onOpenNotes(task);
                } else {
                  setEditingNotesSubtask(task);
                }
              }}
            />
          ))}

          {visibleSubtasks.length === 0 && !isAddingSubtask && (
            <div className="empty-subtasks-hint">
              <span>Nenhuma subtarefa encontrada para os filtros selecionados.</span>
            </div>
          )}
        </div>
      </div>

      {editingNotesSubtask && (
        <NotionNoteEditor
          isOpen={Boolean(editingNotesSubtask)}
          subtask={editingNotesSubtask}
          project={project}
          onSaveNotes={async (sId, notes) => {
            if (onUpdateSubtask) {
              await onUpdateSubtask(sId, { notes });
            }
            setEditingNotesSubtask(null);
          }}
          onClose={() => setEditingNotesSubtask(null)}
        />
      )}

      {onDeleteProject && (
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
          onConfirm={async () => {
            setIsDeleteModalOpen(false);
            await onDeleteProject(project.id);
            onBack();
          }}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

