import React, { useState } from 'react';
import { X, Mail, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { StudyGroup } from '../../types';
import { useToast } from '../../context/ToastContext';

interface InviteEmailModalProps {
  isOpen: boolean;
  group: StudyGroup;
  onClose: () => void;
}

export const InviteEmailModal: React.FC<InviteEmailModalProps> = ({
  isOpen,
  group,
  onClose,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://focus-flow.app';

  const rulesList = (group.rules || [
    'Manter foco absoluto nos blocos de Pomodoro',
    'Compartilhar dúvidas e materiais de estudo relevantes',
    'Respeito mútuo entre todos os membros',
  ])
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  const subject = `Convite para estudar no FocusFlow: Grupo "${group.name}"`;

  const bodyText = `Olá!

Você foi convidado(a) para entrar no grupo de estudos "${group.name}" no FocusFlow!

🎯 Sobre a sala:
${group.description}

🔑 Código de acesso:
${group.code}

📋 Regras de Convivência da Sala:
${rulesList}

Acesse o FocusFlow em: ${appUrl}
Vá na aba "Grupos" e clique em "Entrar com Código" usando: ${group.code}

Vamos focar juntos e bater nossas metas de estudo!`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(bodyText);
    } catch {}
    setCopied(true);
    toast.success('Mensagem de convite copiada para a área de transferência!', 'Convite Copiado');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendMailto = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;

    window.open(mailtoUrl, '_blank');
    toast.success('Cliente de e-mail aberto com o convite pronto para envio!', 'E-mail Iniciado');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="group-rules-icon-badge">
              <Mail size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem' }}>
                Enviar Convite por E-mail
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Convide colegas para a sala #{group.name} com instruções e regras
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSendMailto} className="modal-form" style={{ padding: '1.25rem 1.5rem', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="recipient-email">
              E-mail do Destinatário *
            </label>
            <input
              id="recipient-email"
              type="email"
              className="modal-input"
              placeholder="colega@exemplo.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" htmlFor="preview-email-body">
                Prévia da Mensagem Formatada
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="copy-preview-btn"
                title="Copiar texto do convite"
              >
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <textarea
              id="preview-email-body"
              className="modal-input"
              rows={8}
              readOnly
              value={bodyText}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                lineHeight: '1.45',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-secondary)',
              }}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '0.25rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              <ExternalLink size={15} /> Abrir no E-mail
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
