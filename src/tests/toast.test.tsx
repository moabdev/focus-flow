import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../context/ToastContext';
import { ToastContainer } from '../components/common/ToastContainer';

const TestComponent: React.FC = () => {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Operação realizada com sucesso!', 'Sucesso')}>
        Trigger Success
      </button>
      <button onClick={() => toast.error('Falha na autenticação!', 'Erro')}>
        Trigger Error
      </button>
      <button onClick={() => toast.info('Sua sessão foi salva')}>
        Trigger Info
      </button>
    </div>
  );
};

describe('Toast Notification System', () => {
  it('deve exibir um toast de sucesso e permitir fechá-lo', () => {
    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    expect(screen.queryByText('Operação realizada com sucesso!')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Trigger Success'));

    expect(screen.getByText('Sucesso')).toBeInTheDocument();
    expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Fechar notificação');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Operação realizada com sucesso!')).not.toBeInTheDocument();
  });

  it('deve exibir múltiplos toasts com diferentes tipos', () => {
    render(
      <ToastProvider>
        <TestComponent />
        <ToastContainer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Error'));
    fireEvent.click(screen.getByText('Trigger Info'));

    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(screen.getByText('Falha na autenticação!')).toBeInTheDocument();
    expect(screen.getByText('Sua sessão foi salva')).toBeInTheDocument();
  });
});
