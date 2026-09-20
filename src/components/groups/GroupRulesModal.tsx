import React from 'react';
import { X, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { StudyGroup } from '../../types';

interface GroupRulesModalProps {
  isOpen: boolean;
  group: StudyGroup;
  isAdmin?: boolean;
  onClose: () => void;
  onOpenEdit?: () => void;
}

export const GroupRulesModal: React.FC<GroupRulesModalProps> = ({
  isOpen,
  group,
  isAdmin,
  onClose,
  onOpenEdit,
}) => {
  if (!isOpen) return null;

  const rules = group.rules && group.rules.length > 0 ? group.rules : [
    'Manter foco absoluto nos blocos de Pomodoro',
    'Compartilhar dúvidas e materiais de estudo relevantes',
    'Respeito mútuo e suporte construtivo entre todos os membros',
    'Evitar conversas paralelas ou desrespeito às metas de estudo',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="group-rules-icon-badge">
              <BookOpen size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>
                Regras da Sala #{group.name}
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Diretrizes de convivência e foco estipuladas pelo Administrador
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-form" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
          <div className="rules-list-container">
            {rules.map((rule, idx) => (
              <div key={idx} className="rule-item-card">
                <div className="rule-item-number">{idx + 1}</div>
                <div className="rule-item-content">
                  <span className="rule-item-text">{rule}</span>
                </div>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, opacity: 0.8 }} />
              </div>
            ))}
          </div>

          <div className="rules-footer-badge">
            <ShieldCheck size={16} color="#10b981" />
            <span>O descumprimento contínuo das regras pode resultar em remoção pelo Administrador.</span>
          </div>

          <div className="modal-actions" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
            {isAdmin && onOpenEdit ? (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                onClick={() => {
                  onClose();
                  onOpenEdit();
                }}
              >
                ✏️ Personalizar Regras
              </button>
            ) : <div />}

            <button type="button" className="btn btn-primary" onClick={onClose} style={{ padding: '0.5rem 1.25rem' }}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
