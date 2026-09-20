import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, BookOpen } from 'lucide-react';
import { StudyGroup } from '../../types';
import { CustomSelect, SelectOption } from '../common/CustomSelect';

interface EditGroupModalProps {
  isOpen: boolean;
  group: StudyGroup;
  onClose: () => void;
  onUpdateGroup: (groupId: string, data: Partial<StudyGroup>) => void;
}

const EMOJI_OPTIONS = ['💻', '⚖️', '🩺', '📚', '🎯', '🚀', '🧠', '⚡', '🔬', '🎨', '📐', '💡'];
const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Tecnologia', label: 'Tecnologia', icon: '💻' },
  { value: 'Direito & Concursos', label: 'Direito & Concursos', icon: '⚖️' },
  { value: 'Saúde & Medicina', label: 'Saúde & Medicina', icon: '🩺' },
  { value: 'Idiomas & Linguagens', label: 'Idiomas & Linguagens', icon: '🌍' },
  { value: 'Exatas & Engenharia', label: 'Exatas & Engenharia', icon: '📐' },
  { value: 'Produtividade Geral', label: 'Produtividade Geral', icon: '🚀' },
];

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  group,
  onClose,
  onUpdateGroup,
}) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [category, setCategory] = useState(group.category);
  const [avatarIcon, setAvatarIcon] = useState(group.avatar_icon || EMOJI_OPTIONS[0]);
  const [rulesText, setRulesText] = useState((group.rules || []).join('\n'));

  useEffect(() => {
    setName(group.name);
    setDescription(group.description);
    setCategory(group.category);
    setAvatarIcon(group.avatar_icon || EMOJI_OPTIONS[0]);
    setRulesText((group.rules || []).join('\n'));
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedRules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    onUpdateGroup(group.id, {
      name: name.trim(),
      description: description.trim(),
      category,
      avatar_icon: avatarIcon,
      rules: parsedRules,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Edit3 size={20} color="var(--accent-primary)" />
            <h3 className="modal-title">Editar Grupo de Estudo</h3>
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
            <label className="form-label" htmlFor="edit-group-name">
              Nome do Grupo *
            </label>
            <input
              id="edit-group-name"
              type="text"
              className="modal-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-group-category">
              Categoria / Área
            </label>
            <CustomSelect
              id="edit-group-category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(val) => setCategory(val)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-group-desc">
              Descrição do Grupo
            </label>
            <textarea
              id="edit-group-desc"
              className="modal-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" htmlFor="edit-group-rules" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="var(--accent-primary)" />
                <span>Regras de Convivência & Foco (1 por linha)</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Apenas Administradores
              </span>
            </div>
            <textarea
              id="edit-group-rules"
              className="modal-input"
              rows={4}
              placeholder="Digite uma regra por linha..."
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: '1.5' }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.3rem' }}>
              <Save size={16} /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
