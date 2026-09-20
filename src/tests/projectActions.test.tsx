import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectDetailView } from '../components/projects/ProjectDetailView';
import { Project, Subtask } from '../types';

describe('Ações de Projetos (CRUD, Confirmação Customizada e Detalhes)', () => {
  const mockProject: Project = {
    id: 'proj-101',
    title: 'Arquitetura de Software',
    description: 'Padrões de projeto e microsserviços',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    color: '#0ea5e9',
    icon: '🏗️',
    total_elapsed_seconds: 3600,
    created_at: '2026-09-01T10:00:00Z',
  };

  const mockSubtasks: Subtask[] = [
    {
      id: 'sub-1',
      project_id: 'proj-101',
      title: 'Diagramar C4 Model',
      discipline: 'Arquitetura',
      priority: 'alta',
      pomodoros_estimated: 3,
      pomodoros_completed: 1,
      elapsed_seconds: 1500,
      is_completed: false,
      created_at: '2026-09-01T11:00:00Z',
    },
    {
      id: 'sub-2',
      project_id: 'proj-101',
      title: 'Configurar Docker Compose',
      discipline: 'DevOps',
      priority: 'media',
      pomodoros_estimated: 2,
      pomodoros_completed: 2,
      elapsed_seconds: 2100,
      is_completed: true,
      created_at: '2026-09-01T12:00:00Z',
    },
  ];

  it('deve renderizar o ProjectCard com título, ícone, barra de progresso e botões de ação', () => {
    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={vi.fn()}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    expect(screen.getByText('Arquitetura de Software')).toBeInTheDocument();
    expect(screen.getByText('Padrões de projeto e microsserviços')).toBeInTheDocument();
    expect(screen.getByText('🏗️')).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument(); // 1 of 2 completed
  });

  it('deve disparar onEditProject ao clicar no botão de edição', () => {
    const onEditProject = vi.fn();

    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={onEditProject}
        onDeleteProject={vi.fn()}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle('Editar Projeto');
    fireEvent.click(editBtn);

    expect(onEditProject).toHaveBeenCalledWith(mockProject);
  });

  it('deve abrir o ConfirmModal customizado ao clicar no botão de excluir (SEM usar window.confirm)', () => {
    const onDeleteProject = vi.fn();
    const windowConfirmSpy = vi.spyOn(window, 'confirm');

    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={onDeleteProject}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    // Modal fechado inicialmente
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

    const deleteBtn = screen.getByTitle('Excluir Projeto');
    fireEvent.click(deleteBtn);

    // Modal customizado DEVE abrir
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir Projeto' })).toBeInTheDocument();
    expect(screen.getByText(/"Arquitetura de Software"/i)).toBeInTheDocument();

    // NENHUM window.confirm() nativo deve ter sido chamado!
    expect(windowConfirmSpy).not.toHaveBeenCalled();

    windowConfirmSpy.mockRestore();
  });

  it('deve cancelar a exclusão do projeto ao clicar em Cancelar no modal', () => {
    const onDeleteProject = vi.fn();

    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={onDeleteProject}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Excluir Projeto');
    fireEvent.click(deleteBtn);

    const cancelBtn = screen.getByTestId('confirm-modal-cancel');
    fireEvent.click(cancelBtn);

    expect(onDeleteProject).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('deve confirmar a exclusão e chamar onDeleteProject ao clicar em Excluir no modal', () => {
    const onDeleteProject = vi.fn();

    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={onDeleteProject}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Excluir Projeto');
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByTestId('confirm-modal-confirm');
    fireEvent.click(confirmBtn);

    expect(onDeleteProject).toHaveBeenCalledWith('proj-101');
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('deve alternar a expansão das subtarefas no ProjectCard', () => {
    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={vi.fn()}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    // Subtarefas ocultas inicialmente
    expect(screen.queryByText('Diagramar C4 Model')).not.toBeInTheDocument();

    // Clica no botão de expandir subtarefas
    const toggleBtn = screen.getByRole('button', { name: /Subtarefas/i });
    fireEvent.click(toggleBtn);

    // Agora as subtarefas devem estar visíveis
    expect(screen.getByText('Diagramar C4 Model')).toBeInTheDocument();
    expect(screen.getByText('Configurar Docker Compose')).toBeInTheDocument();
  });

  it('deve criar uma nova subtarefa a partir do formulário inline do ProjectCard', async () => {
    const onCreateSubtask = vi.fn().mockResolvedValue({
      id: 'sub-new',
      project_id: 'proj-101',
      title: 'Escrever Testes Unitários',
      discipline: 'Geral',
      priority: 'alta',
      pomodoros_estimated: 2,
      pomodoros_completed: 0,
      elapsed_seconds: 0,
      is_completed: false,
    });

    render(
      <ProjectCard
        project={mockProject}
        projectSubtasks={mockSubtasks}
        visibleSubtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onEditProject={vi.fn()}
        onDeleteProject={vi.fn()}
        onCreateSubtask={onCreateSubtask}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
        onOpenNotes={vi.fn()}
      />
    );

    // Abre o formulário de subtarefa
    const addSubtaskBtn = screen.getByRole('button', { name: /Subtask/i });
    fireEvent.click(addSubtaskBtn);

    const input = screen.getByPlaceholderText(/Nome da subtarefa/i);
    fireEvent.change(input, { target: { value: 'Escrever Testes Unitários' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateSubtask).toHaveBeenCalledWith(
        'proj-101',
        'Escrever Testes Unitários',
        'Geral',
        2,
        'media',
        '',
        undefined
      );
    });
  });

  it('deve suportar exclusão de projeto com ConfirmModal na tela individual ProjectDetailView', async () => {
    const onDeleteProject = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();
    const onOpenTimerTab = vi.fn();

    render(
      <ProjectDetailView
        project={mockProject}
        subtasks={mockSubtasks}
        activeSubtaskId={null}
        onSelectActiveSubtask={vi.fn()}
        onOpenTimerTab={onOpenTimerTab}
        onBack={onBack}
        onDeleteProject={onDeleteProject}
        onCreateSubtask={vi.fn()}
        onDeleteSubtask={vi.fn()}
        onToggleSubtaskCompleted={vi.fn()}
      />
    );

    // Valida renderização da tela de detalhes
    expect(screen.getByText('Arquitetura de Software')).toBeInTheDocument();
    expect(screen.getByText(/Tempo Investido: 1h 0m/i)).toBeInTheDocument();

    // Botão Voltar
    fireEvent.click(screen.getByText(/Voltar para Projetos/i));
    expect(onBack).toHaveBeenCalledTimes(1);

    // Botão Focar Agora
    fireEvent.click(screen.getByText(/Focar Agora/i));
    expect(onOpenTimerTab).toHaveBeenCalledTimes(1);

    // Botão Excluir Projeto
    const deleteBtn = screen.getByTitle('Excluir este projeto');
    fireEvent.click(deleteBtn);

    // Modal de confirmação surge
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir Projeto' })).toBeInTheDocument();

    // Confirma exclusão
    const confirmBtn = screen.getByTestId('confirm-modal-confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onDeleteProject).toHaveBeenCalledWith('proj-101');
      expect(onBack).toHaveBeenCalledTimes(2);
    });
  });
});
