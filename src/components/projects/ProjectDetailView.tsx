import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Play,
  Search,
} from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '../../types';
import { SubtaskItem } from './SubtaskItem';
import { NotionNoteEditor } from '../NotionNoteEditor';

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
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtaskCompleted,
  onOpenNotes,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEstimated, setNewEstimated] = useState(2);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('media');
  const [newDiscipline, setNewDiscipline] = useState('Geral');
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

  const formatTime = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '0 min';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleCreateSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreateSubtask(project.id, newTitle.trim(), newDiscipline, newEstimated, newPriority);
    setNewTitle('');
    setIsAddingSubtask(false);
  };

  return (
    <div className="project-detail-container">
      <button className="project-detail-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar para Projetos
      </button>

      {/* Hero do Projeto */}
      <div className="project-detail-hero glass-panel" style={{ borderLeftColor: project.color }}>
        <div className="project-hero-header">
          <div className="project-hero-identity">
            <span className="project-hero-icon" style={{ backgroundColor: `${project.color}22` }}>
              {project.icon || '📁'}
            </span>
            <div>
              <h1 className="project-hero-title">{project.title}</h1>
              {project.description && <p className="project-hero-desc">{project.description}</p>}
            </div>
          </div>

          {onOpenTimerTab && (
            <button className="project-focus-btn" onClick={onOpenTimerTab} title="Focar neste projeto no Cronômetro">
              <Play size={16} fill="currentColor" /> Focar Agora
            </button>
          )}
        </div>

        {/* Metadados e Timeline */}
        <div className="project-hero-meta-grid">
          {(project.start_date || project.end_date) && (
            <div className="hero-meta-pill">
              <Calendar size={14} />
              <span>
                {project.start_date || 'Início'} → {project.end_date || 'Sem prazo'}
              </span>
            </div>
          )}
          <div className="hero-meta-pill">
            <Clock size={14} />
            <span>Tempo Investido: {formatTime(totalProjectTimeSpent)}</span>
          </div>
          <div className="hero-meta-pill">
            <CheckCircle2 size={14} />
            <span>
              {completedCount} de {projectSubtasks.length} subtarefas concluídas ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="project-hero-progress-track">
          <div
            className="project-hero-progress-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: project.color || 'var(--accent-primary)',
            }}
          />
        </div>
      </div>

      {/* Seção de Subtarefas do Projeto */}
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

        {/* Formulário de Criação de Subtarefa */}
        {isAddingSubtask && (
          <form className="add-subtask-form inline-form" onSubmit={handleCreateSubtaskSubmit}>
            <input
              type="text"
              className="subtask-input"
              placeholder="Nome da subtarefa..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <div className="add-subtask-options">
              <input
                type="text"
                placeholder="Disciplina (ex: React, Civil)"
                value={newDiscipline}
                onChange={(e) => setNewDiscipline(e.target.value)}
                className="subtask-input"
                style={{ width: '130px' }}
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                className="subtask-select"
              >
                <option value="baixa">Baixa prioridade</option>
                <option value="media">Média prioridade</option>
                <option value="alta">Alta prioridade</option>
              </select>
              <input
                type="number"
                min="1"
                max="20"
                value={newEstimated}
                onChange={(e) => setNewEstimated(parseInt(e.target.value) || 1)}
                className="subtask-num-input"
                title="Ciclos de pomodoro estimados"
              />
              <button type="submit" className="main-start-btn">Salvar</button>
              <button type="button" className="icon-btn" onClick={() => setIsAddingSubtask(false)}>Cancelar</button>
            </div>
          </form>
        )}

        {/* Lista de Subtarefas */}
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

      {/* Editor Notion Modal para a Subtarefa */}
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
    </div>
  );
};
