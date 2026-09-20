import React, { useState } from 'react';
import { X, Mail, Copy, Check, Send, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { StudyGroup } from '../../types';
import { useToast } from '../../context/ToastContext';
import { emailService } from '../../services/emailService';

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
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
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
${customNote ? `\n💬 Mensagem pessoal:\n"${customNote}"\n` : ''}
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

  // Envio Direto com 1 Clique
  const handleSendOneClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      toast.error('Informe o e-mail do destinatário.', 'Campo Obrigatório');
      return;
    }

    if (!emailService.isValidEmail(recipientEmail)) {
      toast.error('Por favor, informe um endereço de e-mail válido.', 'E-mail Inválido');
      return;
    }

    setIsSending(true);
    try {
      const result = await emailService.sendGroupInvite({
        toEmail: recipientEmail,
        group,
        customMessage: customNote,
      });

      if (result.success) {
        toast.success(result.message, 'Convite Enviado!');
        setSentSuccess(true);
      } else {
        toast.error(result.message, 'Falha no Envio');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado ao despachar e-mail';
      toast.error(msg, 'Erro de Conexão');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;

    window.open(mailtoUrl, '_blank');
    toast.success('Cliente de e-mail aberto com o convite pronto para envio!', 'E-mail Iniciado');
  };

  const handleResetForAnother = () => {
    setRecipientEmail('');
    setCustomNote('');
    setSentSuccess(false);
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
                Despache o convite da sala #{group.name} com 1 clique
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {sentSuccess ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Check size={28} />
            </div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Convite Enviado com Sucesso!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              O convite para participar da sala <strong>{group.name}</strong> (código <code>{group.code}</code>) foi
              despachado para <strong>{recipientEmail}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetForAnother}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} /> Enviar Outro Convite
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendOneClick} className="modal-form" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
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
                disabled={isSending}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="custom-note">
                Mensagem Pessoal (Opcional)
              </label>
              <input
                id="custom-note"
                type="text"
                className="modal-input"
                placeholder="Ex: Oi Carlos, montei essa sala para batermos as metas de estudo hoje!"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                disabled={isSending}
                maxLength={180}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" htmlFor="preview-email-body">
                  Prévia do Convite Gerado
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="copy-preview-btn"
                  title="Copiar texto do convite"
                  disabled={isSending}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
              <textarea
                id="preview-email-body"
                className="modal-input"
                rows={6}
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={handleSendMailto}
                className="btn-link"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                disabled={isSending}
                title="Abrir no aplicativo de e-mail padrão do seu dispositivo"
              >
                <ExternalLink size={12} /> Ou abrir no cliente de e-mail (mailto)
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSending}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.65rem 1.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                  }}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Enviando Convite...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Enviar Convite Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
