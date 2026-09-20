import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Check,
  Trash2,
  Edit,
  FileText,
  Play,
  FolderPlus,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Project, Subtask, PriorityLevel } from '../types';
import { NotionNoteEditor } from './NotionNoteEditor';

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
}

const COLOR_OPTIONS = [
  '#ff2a5f', // Ruby
  '#0ea5e9', // Ocean
  '#10b981', // Matcha
  '#a855f7', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

const ICON_OPTIONS = ['🚀', '🤖', '📚', '💼', '🧠', '💻', '🎨', '⚡', '📊', '🔬'];

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
}) => {
  // Estado para Modal de Criação / Edição de Projeto
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [projectColor, setProjectColor] = useState(COLOR_OPTIONS[0]);
  const [projectIcon, setProjectIcon] = useState(ICON_OPTIONS[0]);

  // Estado para Adição rápida de Subtask
  const [addingSubtaskProjectId, setAddingSubtaskProjectId] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskEstimated, setSubtaskEstimated] = useState(2);
  const [subtaskPriority, setSubtaskPriority] = useState<PriorityLevel>('media');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');

  // Estado para Editor Notion
  const [editingNotesSubtask, setEditingNotesSubtask] = useState<Subtask | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Formatação de Segundos para Tempo Legível (ex: 2h 15m 30s)
  const formatSeconds = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '0 min';
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`;
    }
    return `${secs}s`;
  };

  const handleOpenCreateProject = () => {
    setEditingProjectId(null);
    setProjectTitle('');
    setProjectDescription('');
    setProjectStartDate('');
    setProjectEndDate('');
    setProjectColor(COLOR_OPTIONS[0]);
    setProjectIcon(ICON_OPTIONS[0]);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProjectId(proj.id);
    setProjectTitle(proj.title);
    setProjectDescription(proj.description || '');
    setProjectStartDate(proj.start_date || '');
    setProjectEndDate(proj.end_date || '');
    setProjectColor(proj.color || COLOR_OPTIONS[0]);
    setProjectIcon(proj.icon || ICON_OPTIONS[0]);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    if (editingProjectId) {
      await onUpdateProject(editingProjectId, {
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        start_date: projectStartDate || undefined,
        end_date: projectEndDate || undefined,
        color: projectColor,
        icon: projectIcon,
      });
    } else {
      await onCreateProject({
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        start_date: projectStartDate || undefined,
        end_date: projectEndDate || undefined,
        color: projectColor,
        icon: projectIcon,
      });
    }

    setIsProjectModalOpen(false);
  };

  const handleCreateSubtaskSubmit = async (projectId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    await onCreateSubtask(
      projectId,
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
    setAddingSubtaskProjectId(null);
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

            const completedCount = projectSubtasks.filter((s) => s.is_completed).length;
            const progressPercent =
              projectSubtasks.length > 0
                ? Math.round((completedCount / projectSubtasks.length) * 100)
                : 0;

            return (
              <div
                key={proj.id}
                className="project-card glass-panel"
                style={{ borderTop: `4px solid ${proj.color}` }}
              >
                {/* Header do Card do Projeto */}
                <div className="project-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="project-icon-badge" style={{ backgroundColor: `${proj.color}25`, borderColor: proj.color }}>
                      {proj.icon || '📁'}
                    </span>
                    <div>
                      <h3 className="project-card-title">{proj.title}</h3>
                      {proj.description && (
                        <p className="project-card-desc">{proj.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="project-card-actions">
                    <button
                      className="icon-btn"
                      onClick={() => handleOpenEditProject(proj)}
                      title="Editar Projeto"
                      aria-label="Editar Projeto"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="icon-btn text-danger"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o projeto "${proj.title}" e todas as suas subtasks?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="Excluir Projeto"
                      aria-label="Excluir Projeto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Metadados do Projeto: Datas & Tempo Total Decorrido */}
                <div className="project-card-meta">
                  {(proj.start_date || proj.end_date) && (
                    <div className="meta-item">
                      <Calendar size={13} />
                      <span>
                        {proj.start_date || 'Início'} ➔ {proj.end_date || 'Sem prazo'}
                      </span>
                    </div>
                  )}

                  <div className="meta-item time-badge" style={{ color: proj.color }}>
                    <Clock size={13} />
                    <strong>Tempo Total: {formatSeconds(proj.total_elapsed_seconds || 0)}</strong>
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
                        backgroundColor: proj.color,
                        boxShadow: `0 0 10px ${proj.color}80`,
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
                      onClick={() => setAddingSubtaskProjectId(addingSubtaskProjectId === proj.id ? null : proj.id)}
                    >
                      <Plus size={14} /> Adicionar Subtask
                    </button>
                  </div>

                  {/* Formulário Rápido de Criação de Subtask */}
                  {addingSubtaskProjectId === proj.id && (
                    <form
                      onSubmit={(e) => handleCreateSubtaskSubmit(proj.id, e)}
                      className="add-subtask-form glass-panel"
                    >
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
                            onClick={() => setAddingSubtaskProjectId(null)}
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
                      visibleSubtasks.map((sub) => {
                        const isCurrentActive = activeSubtaskId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className={`subtask-item ${sub.is_completed ? 'completed' : ''} ${
                              isCurrentActive ? 'active-focus' : ''
                            }`}
                          >
                            {/* Checkbox de Conclusão */}
                            <button
                              className={`task-checkbox ${sub.is_completed ? 'checked' : ''}`}
                              onClick={() => onToggleSubtaskCompleted(sub.id)}
                              title={sub.is_completed ? 'Desmarcar' : 'Concluir subtask'}
                              aria-label="Concluir subtask"
                            >
                              {sub.is_completed && <Check size={14} />}
                            </button>

                            {/* Informações da Subtask */}
                            <div
                              className="subtask-info"
                              onClick={() => {
                                onSelectActiveSubtask(sub.id);
                                if (onOpenTimerTab) onOpenTimerTab();
                              }}
                              title="Clique para definir esta subtask como foco atual no Timer"
                            >
                              <div className="subtask-title-line">
                                <span className="subtask-title">{sub.title}</span>
                                {isCurrentActive && (
                                  <span className="active-timer-badge">
                                    <Play size={10} /> Em Foco
                                  </span>
                                )}
                              </div>

                              <div className="subtask-details-line">
                                <span className={`priority-pill priority-${sub.priority}`}>
                                  {sub.priority}
                                </span>

                                <span className="pomodoro-count">
                                  🍅 {sub.pomodoros_completed}/{sub.pomodoros_estimated}
                                </span>

                                <span className="subtask-elapsed-badge">
                                  ⏱️ {formatSeconds(sub.elapsed_seconds || 0)}
                                </span>

                                {sub.due_date && (
                                  <span className="subtask-due-date">
                                    📅 {sub.due_date}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ações da Subtask: Anotações Notion e Excluir */}
                            <div className="subtask-actions">
                              <button
                                className={`notion-notes-btn ${sub.notes ? 'has-notes' : ''}`}
                                onClick={() => setEditingNotesSubtask(sub)}
                                title={sub.notes ? 'Ver/Editar Anotações (Notion)' : 'Adicionar Anotações (Notion)'}
                              >
                                <FileText size={15} />
                                <span>{sub.notes ? 'Notas' : '+ Nota'}</span>
                              </button>

                              <button
                                className="icon-btn text-danger"
                                onClick={() => onDeleteSubtask(sub.id)}
                                title="Excluir Subtask"
                                aria-label="Excluir Subtask"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Projeto */}
      {isProjectModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProjectModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProjectId ? 'Editar Projeto' : 'Novo Projeto de Estudo / Trabalho'}
              </h3>
              <button className="icon-btn" onClick={() => setIsProjectModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="modal-content">
              <div>
                <label className="setting-label">Título do Projeto</label>
                <input
                  type="text"
                  placeholder="Ex: Engenharia de Software, Residência Médica, TCC..."
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                  }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="setting-label">Descrição / Objetivo</label>
                <textarea
                  placeholder="Detalhes dos objetivos principais do projeto..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass-subtle)',
                    color: 'var(--text-primary)',
                    marginTop: '0.4rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="setting-label">Data de Início</label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  />
                </div>
                <div>
                  <label className="setting-label">Data de Término (Prazo)</label>
                  <input
                    type="date"
                    value={projectEndDate}
                    onChange={(e) => setProjectEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-glass-subtle)',
                      color: 'var(--text-primary)',
                      marginTop: '0.4rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="setting-label">Ícone do Projeto</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {ICON_OPTIONS.map((ico) => (
                    <button
                      type="button"
                      key={ico}
                      className={`filter-chip ${projectIcon === ico ? 'active' : ''}`}
                      style={{ fontSize: '1.2rem', padding: '0.4rem 0.75rem' }}
                      onClick={() => setProjectIcon(ico)}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="setting-label">Cor de Identificação</label>
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setProjectColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: projectColor === c ? '3px solid #fff' : '2px solid transparent',
                        transform: projectColor === c ? 'scale(1.15)' : 'scale(1)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => setIsProjectModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="main-start-btn"
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
