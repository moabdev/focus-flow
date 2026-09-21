import React from 'react';
import { Copy, Check, Send, Loader2, ExternalLink } from 'lucide-react';

interface InviteEmailFormProps {
  recipientEmail: string;
  setRecipientEmail: (val: string) => void;
  customNote: string;
  setCustomNote: (val: string) => void;
  bodyText: string;
  isSending: boolean;
  copied: boolean;
  onCopy: () => void;
  onSendOneClick: (e: React.FormEvent) => void;
  onSendMailto: () => void;
  onClose: () => void;
}

export const InviteEmailForm: React.FC<InviteEmailFormProps> = ({
  recipientEmail,
  setRecipientEmail,
  customNote,
  setCustomNote,
  bodyText,
  isSending,
  copied,
  onCopy,
  onSendOneClick,
  onSendMailto,
  onClose,
}) => {
  return (
    <form onSubmit={onSendOneClick} className="modal-form" style={{ padding: '1.25rem 1.5rem', gap: '1rem' }}>
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
            onClick={onCopy}
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
          onClick={onSendMailto}
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
  );
};
