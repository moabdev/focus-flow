import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { StudyGroup } from '@/features/core/types';

interface InviteEmailSuccessProps {
  group: StudyGroup;
  recipientEmail: string;
  onClose: () => void;
  onReset: () => void;
}

export const InviteEmailSuccess: React.FC<InviteEmailSuccessProps> = ({
  group,
  recipientEmail,
  onClose,
  onReset,
}) => {
  return (
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
          onClick={onReset}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Sparkles size={14} /> Enviar Outro Convite
        </button>
      </div>
    </div>
  );
};
