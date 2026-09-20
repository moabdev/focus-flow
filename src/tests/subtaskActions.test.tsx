import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubtaskItem } from '../components/projects/SubtaskItem';
import { storageService } from '../services/storage';
import { Subtask, Project } from '../types';

describe('Ações de Subtarefas (Interações na UI e Time-Tracking)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockSubtask: Subtask = {
    id: 'sub-action-1',
    project_id: 'proj-1',
    title: 'Modelagem do Banco de Dados',
    discipline: 'Backend',
    priority: 'alta',
    pomodoros_estimated: 3,
    pomodoros_completed: 1,
    elapsed_seconds: 1800,
    is_completed: false,
    due_date: '2026-09-25',
    notes: 'Anotações sobre PostgreSQL e índices',
    created_at: '2026-09-20T10:00:00Z',
  };

  it('deve renderizar a SubtaskItem com dados completos e badges de prioridade e prazo', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={false}
        onToggleCompleted={vi.fn()}
        onSelectActiveSubtask={vi.fn()}
        onOpenNotes={vi.fn()}
        onDeleteSubtask={vi.fn()}
      />
    );

    expect(screen.getByText('Modelagem do Banco de Dados')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText(/30m/i)).toBeInTheDocument(); // 1800 seconds = 30m
  });

  it('deve disparar onToggleCompleted ao clicar no botão de checkbox', () => {
    const onToggleCompleted = vi.fn();

    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={false}
        onToggleCompleted={onToggleCompleted}
        onSelectActiveSubtask={vi.fn()}
        onOpenNotes={vi.fn()}
        onDeleteSubtask={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText('Concluir subtarefa');
    fireEvent.click(checkbox);

    expect(onToggleCompleted).toHaveBeenCalledWith('sub-action-1');
  });

  it('deve disparar onSelectActiveSubtask e onOpenTimerTab ao clicar no botão Focar', () => {
    const onSelectActiveSubtask = vi.fn();
    const onOpenTimerTab = vi.fn();

    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={false}
        onToggleCompleted={vi.fn()}
        onSelectActiveSubtask={onSelectActiveSubtask}
        onOpenTimerTab={onOpenTimerTab}
        onOpenNotes={vi.fn()}
        onDeleteSubtask={vi.fn()}
      />
    );

    const focusBtn = screen.getByTitle('Iniciar foco nesta subtarefa agora');
    fireEvent.click(focusBtn);

    expect(onSelectActiveSubtask).toHaveBeenCalledWith('sub-action-1');
    expect(onOpenTimerTab).toHaveBeenCalledTimes(1);
  });

  it('deve exibir o badge "Em Foco" quando isCurrentActive for true', () => {
    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={true}
        onToggleCompleted={vi.fn()}
        onSelectActiveSubtask={vi.fn()}
        onOpenNotes={vi.fn()}
        onDeleteSubtask={vi.fn()}
      />
    );

    expect(screen.getByText('Em Foco')).toBeInTheDocument();
  });

  it('deve abrir o modal de notas Notion ao clicar no botão de notas', () => {
    const onOpenNotes = vi.fn();

    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={false}
        onToggleCompleted={vi.fn()}
        onSelectActiveSubtask={vi.fn()}
        onOpenNotes={onOpenNotes}
        onDeleteSubtask={vi.fn()}
      />
    );

    const notesBtn = screen.getByTitle('Ver/Editar Anotações (Notion)');
    fireEvent.click(notesBtn);

    expect(onOpenNotes).toHaveBeenCalledWith(mockSubtask);
  });

  it('deve disparar onDeleteSubtask ao clicar no botão de lixeira da subtarefa', () => {
    const onDeleteSubtask = vi.fn();

    render(
      <SubtaskItem
        subtask={mockSubtask}
        isCurrentActive={false}
        onToggleCompleted={vi.fn()}
        onSelectActiveSubtask={vi.fn()}
        onOpenNotes={vi.fn()}
        onDeleteSubtask={onDeleteSubtask}
      />
    );

    const deleteBtn = screen.getByTitle('Excluir Subtask');
    fireEvent.click(deleteBtn);

    expect(onDeleteSubtask).toHaveBeenCalledWith('sub-action-1');
  });

  it('deve acumular tempo gasto (addTimeSpent) e sincronizar entre subtarefa e projeto pai', async () => {
    const project: Project = {
      id: 'proj-sync',
      title: 'Projeto Sincronização',
      color: '#10b981',
      total_elapsed_seconds: 0,
      created_at: new Date().toISOString(),
    };
    await storageService.saveProject(project);

    const subtask: Subtask = {
      id: 'sub-sync',
      project_id: 'proj-sync',
      title: 'Indexação B-Tree',
      priority: 'alta',
      pomodoros_estimated: 1,
      pomodoros_completed: 0,
      elapsed_seconds: 0,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    await storageService.saveSubtask(subtask);

    // Adiciona 1200 segundos (20 min)
    const res = await storageService.addTimeSpent('sub-sync', 1200);

    expect(res.subtask?.elapsed_seconds).toBe(1200);
    expect(res.project?.total_elapsed_seconds).toBe(1200);

    // Valida persistência
    const loadedProjects = storageService.getLocalProjects();
    const loadedSubtasks = storageService.getLocalSubtasks();

    expect(loadedProjects.find((p) => p.id === 'proj-sync')?.total_elapsed_seconds).toBe(1200);
    expect(loadedSubtasks.find((s) => s.id === 'sub-sync')?.elapsed_seconds).toBe(1200);
  });
});
