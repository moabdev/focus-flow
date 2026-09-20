import React, { useState } from 'react';
import { Plus, FolderPlus, Sparkles } from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '../types';
import { NotionNoteEditor } from './NotionNoteEditor';
import { ProjectModal } from './projects/ProjectModal';
import { ProjectCard } from './projects/ProjectCard';

interface ProjectManagerProps {
  projects: Project[];
  subtasks: Subtask[];
  activeSubtaskId: string | null;
  onSelectActiveSubtask: (id: string) => void;
  onCreateProject: (data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    color?: string;
    icon?: string;
  }) => Promise<Project>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCreateSubtask: (
    projectId: string,
    title: string,
    discipline: string,
    estimated: number,
    priority: PriorityLevel,
    notes?: string,
    due_date?: string
  ) => Promise<Subtask | null>;
  onUpdateSubtask: (id: string, data: Partial<Subtask>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onToggleSubtaskCompleted: (id: string) => Promise<void>;
  onOpenTimerTab?: () => void;
  onOpenProjectDetail?: (id: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  subtasks,
  activeSubtaskId,
  onSelectActiveSubtask,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtaskCompleted,
  onOpenTimerTab,
  onOpenProjectDetail,
}) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingNotesSubtask, setEditingNotesSubtask] = useState<Subtask | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    color?: string;
    icon?: string;
  }) => {
    if (editingProject) {
      await onUpdateProject(editingProject.id, data);
    } else {
      await onCreateProject(data);
    }
    setIsProjectModalOpen(false);
  };

  return (
    <div className="project-manager-container">
      {/* Barra de Topo do Gerenciador */}
      <div className="pm-header">
        <div>
          <h2 className="pm-title">Projetos & Tarefas</h2>
          <p className="pm-subtitle">
            Estruture seus projetos, defina prazos e monitore com precisão o tempo gasto em cada subtask.
          </p>
        </div>

        <button className="main-start-btn" onClick={handleOpenCreateProject}>
          <FolderPlus size={18} /> Novo Projeto
        </button>
      </div>

      {/* Barra de Busca e Filtros de Status */}
      <div className="pm-filters-bar">
        <input
          type="text"
          className="pm-search-input"
          placeholder="Buscar projetos ou subtasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="task-filter-chips">
          <button
            className={`filter-chip ${filterStatus === 'todas' ? 'active' : ''}`}
            onClick={() => setFilterStatus('todas')}
          >
            Todas
          </button>
          <button
            className={`filter-chip ${filterStatus === 'pendentes' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pendentes')}
          >
            Pendentes
          </button>
          <button
            className={`filter-chip ${filterStatus === 'concluidas' ? 'active' : ''}`}
            onClick={() => setFilterStatus('concluidas')}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* Lista de Cards de Projetos */}
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-projects-state glass-panel">
            <Sparkles size={36} color="var(--accent-primary)" />
            <h3>Nenhum projeto cadastrado ainda</h3>
            <p>Crie seu primeiro projeto para começar a organizar suas metas e subtasks!</p>
            <button className="main-start-btn" onClick={handleOpenCreateProject} style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Criar Projeto
            </button>
          </div>
        ) : (
          projects.map((proj) => {
            const projectSubtasks = subtasks.filter((s) => s.project_id === proj.id);
            const visibleSubtasks = projectSubtasks.filter((s) => {
              if (filterStatus === 'pendentes' && s.is_completed) return false;
              if (filterStatus === 'concluidas' && !s.is_completed) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const mTitle = s.title.toLowerCase().includes(q);
                const mNotes = (s.notes || '').toLowerCase().includes(q);
                return mTitle || mNotes;
              }
              return true;
            });

            return (
              <ProjectCard
                key={proj.id}
                project={proj}
                projectSubtasks={projectSubtasks}
                visibleSubtasks={visibleSubtasks}
                activeSubtaskId={activeSubtaskId}
                onSelectActiveSubtask={onSelectActiveSubtask}
                onOpenTimerTab={onOpenTimerTab}
                onOpenProjectDetail={onOpenProjectDetail}
                onEditProject={handleOpenEditProject}
                onDeleteProject={onDeleteProject}
                onCreateSubtask={onCreateSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onToggleSubtaskCompleted={onToggleSubtaskCompleted}
                onOpenNotes={setEditingNotesSubtask}
              />
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Projeto */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        editingProject={editingProject}
        onSave={handleSaveProject}
      />

      {/* Editor de Anotações Notion-style para Subtasks */}
      {editingNotesSubtask && (
        <NotionNoteEditor
          isOpen={true}
          onClose={() => setEditingNotesSubtask(null)}
          subtask={editingNotesSubtask}
          project={projects.find((p) => p.id === editingNotesSubtask.project_id) || null}
          onSaveNotes={(subId, notes) => {
            onUpdateSubtask(subId, { notes });
          }}
        />
      )}
    </div>
  );
};
