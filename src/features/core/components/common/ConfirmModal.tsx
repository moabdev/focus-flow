import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, AlertCircle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  confirmIcon,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Escuta tecla Escape para fechar
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const renderIcon = () => {
    if (confirmIcon) return confirmIcon;
    switch (variant) {
      case 'danger':
        return <Trash2 size={24} className="confirm-icon-danger" />;
      case 'warning':
        return <AlertTriangle size={24} className="confirm-icon-warning" />;
      case 'primary':
      default:
        return <AlertCircle size={24} className="confirm-icon-primary" />;
    }
  };

  return createPortal(
    <div
      className="modal-backdrop confirm-modal-backdrop"
      onClick={onCancel}
      role="presentation"
      data-testid="confirm-modal-backdrop"
    >
      <div
        className={`confirm-modal-box confirm-modal-${variant}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        data-testid="confirm-modal"
      >
        <button
          type="button"
          className="confirm-modal-close-btn"
          onClick={onCancel}
          aria-label="Fechar modal"
          title="Fechar"
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon-badge ${variant}`}>
            {renderIcon()}
          </div>
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
        </div>

        <div id="confirm-modal-desc" className="confirm-modal-body">
          {message}
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn btn-secondary confirm-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="confirm-modal-cancel"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`btn ${variant === 'danger' ? 'confirm-btn-danger' : variant === 'warning' ? 'confirm-btn-warning' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-modal-confirm"
            autoFocus
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
