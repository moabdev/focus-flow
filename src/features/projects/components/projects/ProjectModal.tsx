import React, { useState, useEffect } from 'react';
import { Project } from '@/features/core/types';

export const COLOR_OPTIONS = [
  '#ff2a5f', // Ruby
  '#0ea5e9', // Ocean
  '#10b981', // Matcha
  '#a855f7', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

export const ICON_OPTIONS = ['🚀', '🤖', '📚', '💼', '🧠', '💻', '🎨', '⚡', '📊', '🔬'];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  onSave: (data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    color?: string;
    icon?: string;
  }) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  editingProject,
  onSave,
}) => {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [projectColor, setProjectColor] = useState(COLOR_OPTIONS[0]);
  const [projectIcon, setProjectIcon] = useState(ICON_OPTIONS[0]);

  useEffect(() => {
    if (editingProject) {
      setProjectTitle(editingProject.title);
      setProjectDescription(editingProject.description || '');
      setProjectStartDate(editingProject.start_date || '');
      setProjectEndDate(editingProject.end_date || '');
      setProjectColor(editingProject.color || COLOR_OPTIONS[0]);
      setProjectIcon(editingProject.icon || ICON_OPTIONS[0]);
    } else {
      setProjectTitle('');
      setProjectDescription('');
      setProjectStartDate('');
      setProjectEndDate('');
      setProjectColor(COLOR_OPTIONS[0]);
      setProjectIcon(ICON_OPTIONS[0]);
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    await onSave({
      title: projectTitle.trim(),
      description: projectDescription.trim(),
      start_date: projectStartDate || undefined,
      end_date: projectEndDate || undefined,
      color: projectColor,
      icon: projectIcon,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editingProject ? 'Editar Projeto' : 'Novo Projeto de Estudo / Trabalho'}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
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

          <div className="project-modal-dates-grid">
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
              onClick={onClose}
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
  );
};
