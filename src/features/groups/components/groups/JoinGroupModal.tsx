import React, { useState } from 'react';
import { X, KeyRound, Sparkles } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (code: string) => { success: boolean; error?: string };
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoinGroup,
}) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const result = onJoinGroup(code.trim());
    if (result.success) {
      setCode('');
      setErrorMessage('');
      onClose();
    } else {
      setErrorMessage(result.error || 'Código inválido.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <KeyRound size={22} color="var(--accent-primary)" />
            <h3 className="modal-title">Entrar em um Grupo</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Digite ou cole o código de convite compartilhado por um colega (ex: <code>DEV-2026</code> ou <code>GRP-1234</code>):
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="join-group-code">
              Código de Convite *
            </label>
            <input
              id="join-group-code"
              type="text"
              className="modal-input"
              placeholder="Ex: DEV-2026"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorMessage('');
              }}
              required
              autoFocus
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
            />
            {errorMessage && (
              <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                {errorMessage}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="main-start-btn">
              <Sparkles size={16} /> Entrar no Grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
