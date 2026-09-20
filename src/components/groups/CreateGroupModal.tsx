import React, { useState } from 'react';
import { X, Users, Sparkles } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: {
    name: string;
    description: string;
    category: string;
    avatar_icon: string;
  }) => void;
}

const EMOJI_OPTIONS = ['💻', '⚖️', '🩺', '📚', '🎯', '🚀', '🧠', '⚡', '🔬', '🎨'];
const CATEGORY_OPTIONS = [
  'Tecnologia',
  'Direito & Concursos',
  'Saúde & Medicina',
  'Idiomas & Linguagens',
  'Exatas & Engenharia',
  'Produtividade Geral',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [avatarIcon, setAvatarIcon] = useState(EMOJI_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateGroup({
      name: name.trim(),
      description: description.trim(),
      category,
      avatar_icon: avatarIcon,
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={22} color="var(--accent-primary)" />
            <h3 className="modal-title">Novo Grupo de Estudo</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Ícone do Grupo</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`filter-chip ${avatarIcon === emoji ? 'active' : ''}`}
                  onClick={() => setAvatarIcon(emoji)}
                  style={{ fontSize: '1.2rem', padding: '0.4rem 0.6rem' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group-name">
              Nome do Grupo *
            </label>
            <input
              id="group-name"
              type="text"
              className="modal-input"
              placeholder="Ex: Desenvolvedores Full-Stack..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group-category">
              Categoria / Área
            </label>
            <select
              id="group-category"
              className="modal-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group-desc">
              Descrição e Regras de Foco
            </label>
            <textarea
              id="group-desc"
              className="modal-input"
              rows={3}
              placeholder="Descreva o propósito do grupo e metas de estudo diárias..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="main-start-btn">
              <Sparkles size={16} /> Criar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
