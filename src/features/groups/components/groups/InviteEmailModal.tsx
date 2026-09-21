import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { StudyGroup } from '@/features/core/types';
import { useToast } from '@/features/core/contexts/ToastContext';
import { emailService } from '@/features/core/api/emailService';
import { InviteEmailSuccess } from './InviteEmailSuccess';
import { InviteEmailForm } from './InviteEmailForm';

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
          <InviteEmailSuccess
            group={group}
            recipientEmail={recipientEmail}
            onClose={onClose}
            onReset={handleResetForAnother}
          />
        ) : (
          <InviteEmailForm
            recipientEmail={recipientEmail}
            setRecipientEmail={setRecipientEmail}
            customNote={customNote}
            setCustomNote={setCustomNote}
            bodyText={bodyText}
            isSending={isSending}
            copied={copied}
            onCopy={handleCopy}
            onSendOneClick={handleSendOneClick}
            onSendMailto={handleSendMailto}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
