import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project } from '@/features/core/types';
import { MindMapTemplate } from '@/features/mindmaps/api/storageMindMaps';

export const TEMPLATE_OPTIONS: { id: MindMapTemplate; label: string; emoji: string; desc: string }[] = [
  {
    id: 'blank',
    label: 'Mapa em Branco',
    emoji: '🧠',
    desc: 'Começa do zero com apenas a ideia central.',
  },
  {
    id: 'study_summary',
    label: 'Resumo de Estudo',
    emoji: '📖',
    desc: 'Conceitos, exemplos e pontos de atenção pré-configurados.',
  },
  {
    id: 'project_breakdown',
    label: 'Breakdown de Projeto',
    emoji: '🚀',
    desc: 'Objetivos, etapas de execução e riscos estruturados.',
  },
];

interface MindMapCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateMap: (title: string, desc: string, projectId: string | undefined, template: MindMapTemplate) => void;
}

export const MindMapCreateModal: React.FC<MindMapCreateModalProps> = ({
  isOpen,
  onClose,
  projects,
  onCreateMap,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<MindMapTemplate>('blank');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateMap(newTitle.trim(), newDesc.trim(), newProjectId, selectedTemplate);
    setNewTitle('');
    setNewDesc('');
    setNewProjectId(undefined);
    setSelectedTemplate('blank');
  };

  return (
    <div className="study-modal-overlay" onClick={onClose}>
      <div className="study-modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="study-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Novo Mapa Mental</h2>
          <button className="btn-deck-icon" onClick={onClose} aria-label="Fechar">
            <span style={{ fontSize: '1.25rem' }}>✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Título do Mapa *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Redes de Computadores, Farmacologia Clínica, Sistema Solar..."
              required
              autoFocus
              className="mindmap-node-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Descrição (Opcional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Contexto, objetivo ou foco deste mapa..."
              rows={2}
              className="mindmap-node-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Escolha um Template
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {TEMPLATE_OPTIONS.map((t) => (
                <label
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedTemplate === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    background: selectedTemplate === t.id ? 'rgba(255,42,95,0.06)' : 'var(--bg-primary)',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={selectedTemplate === t.id}
                    onChange={() => setSelectedTemplate(t.id)}
                    style={{ marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Vincular a Projeto (Opcional)
              </label>
              <select
                value={newProjectId || ''}
                onChange={(e) => setNewProjectId(e.target.value || undefined)}
                className="flashcards-filter-select"
                style={{ width: '100%' }}
              >
                <option value="">Sem vínculo</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📁'} {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn-deck-icon" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-study-deck" style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>
              <Plus size={16} /> Criar Mapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
