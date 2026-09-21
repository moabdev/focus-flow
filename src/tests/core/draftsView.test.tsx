import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DraftsView } from '@/features/drafts/components/drafts/DraftsView';
import { ToastProvider } from '@/features/core/contexts/ToastContext';
import { storageService } from '@/features/core/api/storage';
import { Project, Subtask } from '@/features/core/types';

describe('Tela de Listagem de Rascunhos & Notas Rápidas (DraftsView)', () => {
  const mockProjects: Project[] = [
    {
      id: 'p-1',
      title: 'Direito Constitucional',
      color: '#ff2a5f',
      icon: '⚖️',
      total_elapsed_seconds: 3600,
      created_at: '2026-09-20T10:00:00Z',
    },
    {
      id: 'p-2',
      title: 'Ciência da Computação',
      color: '#3b82f6',
      icon: '💻',
      total_elapsed_seconds: 7200,
      created_at: '2026-09-20T10:00:00Z',
    },
  ];

  const mockSubtasks: Subtask[] = [
    {
      id: 'sub-1',
      project_id: 'p-1',
      title: 'Controle de Constitucionalidade',
      priority: 'alta',
      pomodoros_estimated: 4,
      pomodoros_completed: 1,
      is_completed: false,
      created_at: '2026-09-20T10:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Cria rascunhos de teste
    storageService.saveQuickNotes([
      {
        id: 'draft-1',
        title: 'Resumo de Ações Constitucionais',
        content: 'ADI, ADC, ADPF e princípios da simetria.',
        project_id: 'p-1',
        subtask_id: 'sub-1',
        created_at: '2026-09-20T10:00:00Z',
        updated_at: '2026-09-20T10:30:00Z',
      },
      {
        id: 'draft-2',
        title: 'Algoritmos de Grafos',
        content: 'Dijkstra, Bellman-Ford e BFS/DFS.',
        project_id: 'p-2',
        subtask_id: null,
        created_at: '2026-09-20T09:00:00Z',
        updated_at: '2026-09-20T09:30:00Z',
      },
    ]);
  });

  it('deve renderizar a tela de listagem de rascunhos com título, cards e filtros', () => {
    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    expect(screen.getByText('Rascunhos & Anotações Rápidas')).toBeInTheDocument();
    expect(screen.getByText('Resumo de Ações Constitucionais')).toBeInTheDocument();
    expect(screen.getByText('Algoritmos de Grafos')).toBeInTheDocument();
    expect(screen.getByText(/ADI, ADC, ADPF/i)).toBeInTheDocument();
    expect(screen.getByText(/Dijkstra, Bellman-Ford/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Rascunho/i })).toBeInTheDocument();
  });

  it('deve filtrar rascunhos em tempo real pelo campo de busca', () => {
    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por título ou conteúdo/i);
    fireEvent.change(searchInput, { target: { value: 'Dijkstra' } });

    expect(screen.getByText('Algoritmos de Grafos')).toBeInTheDocument();
    expect(screen.queryByText('Resumo de Ações Constitucionais')).not.toBeInTheDocument();
  });

  it('deve alternar entre visualização em Grade e visualização em Editor Dividido', () => {
    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    const splitBtn = screen.getByRole('button', { name: /Editor/i });
    fireEvent.click(splitBtn);

    // No modo dividido, exibe o input de título e a textarea do rascunho ativo
    expect(screen.getByPlaceholderText(/Título do rascunho/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escreva livremente suas ideias/i)).toBeInTheDocument();

    // Retorna para o modo grade
    const gridBtn = screen.getByRole('button', { name: /Grade/i });
    fireEvent.click(gridBtn);
    expect(screen.getByText('Resumo de Ações Constitucionais')).toBeInTheDocument();
  });

  it('deve criar um novo rascunho ao clicar em "Novo Rascunho"', () => {
    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    const newBtn = screen.getByRole('button', { name: /Novo Rascunho/i });
    fireEvent.click(newBtn);

    // Alterna para o editor com o novo rascunho criado
    expect(screen.getByDisplayValue('Novo Rascunho')).toBeInTheDocument();
  });

  it('deve abrir ConfirmModal ao excluir rascunho e confirmar exclusão com sucesso', () => {
    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    // Clica no botão de excluir do primeiro card
    const deleteButtons = screen.getAllByTitle('Excluir rascunho');
    fireEvent.click(deleteButtons[0]);

    // Modal customizado abre
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir Rascunho' })).toBeInTheDocument();

    // Cancela primeiro
    fireEvent.click(screen.getByTestId('confirm-modal-cancel'));
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

    // Reabre e confirma exclusão
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId('confirm-modal-confirm'));

    // Modal fecha e rascunho é removido
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('deve copiar o texto do rascunho para a área de transferência', () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ToastProvider>
        <DraftsView projects={mockProjects} subtasks={mockSubtasks} />
      </ToastProvider>
    );

    const copyButtons = screen.getAllByTitle('Copiar texto do rascunho');
    fireEvent.click(copyButtons[0]);

    expect(writeTextMock).toHaveBeenCalled();
  });
});
