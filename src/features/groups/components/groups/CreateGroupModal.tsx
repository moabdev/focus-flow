import React, { useState } from 'react';
import { X, Users, Sparkles, BookOpen } from 'lucide-react';
import { CustomSelect, SelectOption } from '@/features/core/components/common/CustomSelect';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: {
    name: string;
    description: string;
    category: string;
    avatar_icon: string;
    rules?: string[];
  }) => void;
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

const DEFAULT_RULES_TEMPLATE = [
  'Manter foco absoluto nos blocos de Pomodoro',
  'Compartilhar dúvidas e materiais de estudo relevantes',
  'Respeito mútuo entre todos os membros',
  'Sem conversas paralelas ou desrespeito',
].join('\n');

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [avatarIcon, setAvatarIcon] = useState(EMOJI_OPTIONS[0]);
  const [rulesText, setRulesText] = useState(DEFAULT_RULES_TEMPLATE);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedRules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    onCreateGroup({
      name: name.trim(),
      description: description.trim(),
      category,
      avatar_icon: avatarIcon,
      rules: parsedRules.length > 0 ? parsedRules : undefined,
    });

    setName('');
    setDescription('');
    setRulesText(DEFAULT_RULES_TEMPLATE);
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
            <CustomSelect
              id="group-category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(val) => setCategory(val)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="group-desc">
              Descrição do Grupo
            </label>
            <textarea
              id="group-desc"
              className="modal-input"
              rows={2}
              placeholder="Descreva o propósito do grupo e metas de estudo diárias..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" htmlFor="group-rules" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={14} color="var(--accent-primary)" />
                <span>Regras de Convivência & Foco (1 por linha)</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Personalizável pelo Admin
              </span>
            </div>
            <textarea
              id="group-rules"
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
            <button type="submit" className="main-start-btn">
              <Sparkles size={16} /> Criar Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
