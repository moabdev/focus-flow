import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectModal } from '../../features/projects/components/projects/ProjectModal';
import { Project } from '../../features/core/types';

describe('ProjectModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    editingProject: null,
    onSave: mockOnSave,
  };

  const mockEditingProject: Project = {
    id: 'p1',
    title: 'Projeto Teste',
    description: 'Descrição Teste',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    color: '#0ea5e9',
    icon: '🚀',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve renderizar nada se isOpen for falso', () => {
    const { container } = render(<ProjectModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('deve renderizar o modal no modo criação', () => {
    render(<ProjectModal {...defaultProps} />);
    
    expect(screen.getByText('Novo Projeto de Estudo / Trabalho')).toBeInTheDocument();
    expect(screen.getByText('Título do Projeto')).toBeInTheDocument();
  });

  it('deve renderizar o modal no modo edição', () => {
    render(<ProjectModal {...defaultProps} editingProject={mockEditingProject} />);
    
    expect(screen.getByText('Editar Projeto')).toBeInTheDocument();
    
    // Verifica se os campos foram preenchidos
    const titleInput = screen.getByPlaceholderText(/Ex: Engenharia de Software/i);
    expect(titleInput).toHaveValue('Projeto Teste');
    
    const descInput = screen.getByPlaceholderText(/Detalhes dos objetivos/i);
    expect(descInput).toHaveValue('Descrição Teste');
  });

  it('deve chamar onSave com os dados corretos e fechar o modal', async () => {
    render(<ProjectModal {...defaultProps} />);
    
    // Preenche título
    const titleInput = screen.getByPlaceholderText(/Ex: Engenharia de Software/i);
    fireEvent.change(titleInput, { target: { value: 'Novo Projeto' } });
    
    // Envia form
    const submitBtn = screen.getByRole('button', { name: /Salvar Projeto/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Novo Projeto',
        description: '',
        start_date: undefined,
        end_date: undefined,
        color: '#ff2a5f',
        icon: '🚀',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('não deve chamar onSave se o título estiver vazio', async () => {
    render(<ProjectModal {...defaultProps} />);
    
    const submitBtn = screen.getByRole('button', { name: /Salvar Projeto/i });
    fireEvent.click(submitBtn);
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve chamar onClose ao clicar no botão cancelar', () => {
    render(<ProjectModal {...defaultProps} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
