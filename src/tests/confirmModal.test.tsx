import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../components/common/ConfirmModal';

describe('ConfirmModal Component (Modal de Confirmação Acessível & Glassmorphism)', () => {
  it('não deve renderizar nada quando isOpen for false', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Excluir Item"
        message="Tem certeza?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('deve renderizar título, mensagem e botões quando isOpen for true', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Excluir Projeto de Pesquisa"
        message="Esta ação é permanente e irreversível."
        confirmText="Sim, excluir"
        cancelText="Voltar"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Excluir Projeto de Pesquisa')).toBeInTheDocument();
    expect(screen.getByText('Esta ação é permanente e irreversível.')).toBeInTheDocument();
    expect(screen.getByText('Sim, excluir')).toBeInTheDocument();
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  it('deve disparar onConfirm ao clicar no botão de confirmação', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmação"
        message="Deseja prosseguir?"
        confirmText="Confirmar Ação"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-modal-confirm');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('deve disparar onCancel ao clicar no botão Cancelar ou no botão Fechar (X)', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Atenção"
        message="Deseja cancelar?"
        cancelText="Desistir"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByTestId('confirm-modal-cancel');
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/Fechar modal/i);
    fireEvent.click(closeBtn);
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('deve disparar onCancel ao clicar no backdrop', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Fechar ao Clicar Fora"
        message="Conteúdo teste"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const backdrop = screen.getByTestId('confirm-modal-backdrop');
    fireEvent.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deve disparar onCancel ao pressionar a tecla Escape', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Teste Escape"
        message="Pressione ESC para fechar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar variantes danger e warning corretamente', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        title="Perigo"
        message="Ação perigosa"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('confirm-modal')).toHaveClass('confirm-modal-danger');

    rerender(
      <ConfirmModal
        isOpen={true}
        title="Aviso"
        message="Ação com aviso"
        variant="warning"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('confirm-modal')).toHaveClass('confirm-modal-warning');
  });

  it('deve desabilitar botões e mostrar texto de loading durante isLoading', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Excluindo..."
        message="Por favor aguarde"
        confirmText="Excluir"
        isLoading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-modal-confirm');
    const cancelBtn = screen.getByTestId('confirm-modal-cancel');

    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveTextContent('Processando...');
    expect(cancelBtn).toBeDisabled();
  });
});
