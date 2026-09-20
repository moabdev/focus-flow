import React, { useState } from 'react';
import {
  X,
  Info,
  BookOpen,
  Share2,
  Mail,
  Edit3,
  Check,
  Users,
  Shield,
  Hash,
} from 'lucide-react';
import { StudyGroup, GroupMember } from '../../types';
import { useToast } from '../../context/ToastContext';

interface GroupInfoModalProps {
  isOpen: boolean;
  group: StudyGroup;
  members: GroupMember[];
  isAdmin?: boolean;
  isCreator?: boolean;
  onClose: () => void;
  onOpenRules: () => void;
  onOpenEmailInvite: () => void;
  onOpenEdit?: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  group,
  members,
  isAdmin,
  onClose,
  onOpenRules,
  onOpenEmailInvite,
  onOpenEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(group.code);
    } catch {}
    setCopied(true);
    toast.success(`Código ${group.code} copiado para a área de transferência!`, 'Código Copiado');
    setTimeout(() => setCopied(false), 2500);
  };

  const focusingCount = members.filter((m) => m.current_status === 'focusing').length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel group-info-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="group-info-icon-badge">
              <Info size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                Informações da Sala
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Detalhes, regras de convivência e opções de convite
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-form group-info-modal-body">
          {/* Card de Identidade da Sala */}
          <div className="group-info-hero-card">
            <div className="group-info-avatar-large">
              <span>{group.avatar_icon}</span>
            </div>
            <div className="group-info-hero-text">
              <h2 className="group-info-name">{group.name}</h2>
              <div className="group-info-badges-row">
                <span className="group-category-badge">{group.category}</span>
                <span className="group-info-members-badge">
                  <Users size={12} /> {group.member_count} membros ({focusingCount} focando)
                </span>
                {group.created_by && (
                  <span className="group-info-creator-badge">
                    <Shield size={12} /> Criado por {group.created_by}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Código de Convite com Ação Rápida de Cópia */}
          <div className="group-info-code-section">
            <div className="group-info-code-label">
              <Hash size={14} color="var(--accent-primary)" />
              <span>Código de Acesso & Convite:</span>
            </div>
            <div className="group-info-code-box">
              <code className="group-info-code-text">{group.code}</code>
              <button
                type="button"
                className="btn btn-secondary group-info-copy-btn"
                onClick={handleCopyCode}
                title="Copiar código de convite"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>

          {/* Descrição Completa */}
          <div className="group-info-desc-section">
            <h4 className="group-info-section-title">Sobre esta Sala</h4>
            <p className="group-info-desc-text">
              {group.description || 'Nenhuma descrição fornecida para este grupo.'}
            </p>
          </div>

          {/* Seção de Regras */}
          {group.rules && group.rules.length > 0 && (
            <div className="group-info-rules-section">
              <div className="group-info-rules-header">
                <h4 className="group-info-section-title">
                  <BookOpen size={14} color="var(--accent-primary)" />
                  <span>Regras da Sala ({group.rules.length})</span>
                </h4>
                <button
                  type="button"
                  className="group-info-link-btn"
                  onClick={() => {
                    onClose();
                    onOpenRules();
                  }}
                >
                  Ver em Detalhes →
                </button>
              </div>
              <ul className="group-info-rules-preview">
                {group.rules.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
                {group.rules.length > 3 && (
                  <li className="rules-more-count">
                    + {group.rules.length - 3} regras adicionais...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Ações Rápidas no Rodapé */}
          <div className="group-info-footer-actions">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary group-info-action-btn"
                onClick={() => {
                  onClose();
                  onOpenEmailInvite();
                }}
              >
                <Mail size={14} />
                <span>Convidar por E-mail</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary group-info-action-btn"
                onClick={() => {
                  onClose();
                  onOpenRules();
                }}
              >
                <BookOpen size={14} />
                <span>Regras de Convivência</span>
              </button>

              {isAdmin && onOpenEdit && (
                <button
                  type="button"
                  className="btn btn-secondary group-info-action-btn"
                  onClick={() => {
                    onClose();
                    onOpenEdit();
                  }}
                >
                  <Edit3 size={14} />
                  <span>Editar Sala</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ padding: '0.55rem 1.35rem' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
