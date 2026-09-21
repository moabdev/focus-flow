import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectManager } from '../../features/projects/components/ProjectManager';
import { Project, Subtask } from '../../features/core/types';

describe('ProjectManager Component', () => {
  const mockProjects: Project[] = [
    {
      id: 'p1',
      title: 'Project 1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockSubtasks: Subtask[] = [
    {
      id: 's1',
      project_id: 'p1',
      title: 'Subtask 1',
      discipline: 'Test',
      estimated_pomodoros: 2,
      priority: 'alta',
      is_completed: false,
      completed_pomodoros: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    projects: mockProjects,
    subtasks: mockSubtasks,
    activeSubtaskId: null,
    onSelectActiveSubtask: vi.fn(),
    onCreateProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onCreateSubtask: vi.fn(),
    onUpdateSubtask: vi.fn(),
    onDeleteSubtask: vi.fn(),
    onToggleSubtaskCompleted: vi.fn(),
  };

  it('deve renderizar a lista de projetos e subtasks', () => {
    render(<ProjectManager {...defaultProps} />);
    
    expect(screen.getByText('Projetos & Tarefas')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
  });

  it('deve exibir mensagem de estado vazio quando não houver projetos', () => {
    render(<ProjectManager {...defaultProps} projects={[]} />);
    
    expect(screen.getByText('Nenhum projeto cadastrado ainda')).toBeInTheDocument();
  });

  it('deve abrir o modal de criação de projeto ao clicar no botão "Novo Projeto"', () => {
    render(<ProjectManager {...defaultProps} />);
    
    const newProjectBtn = screen.getByRole('button', { name: /Novo Projeto/i });
    fireEvent.click(newProjectBtn);
    
    // O modal deve aparecer
    expect(screen.getByText('Novo Projeto de Estudo / Trabalho')).toBeInTheDocument();
  });

  it('deve filtrar subtasks concluídas', () => {
    render(<ProjectManager {...defaultProps} />);
    
    // Clica no filtro "Concluídas"
    const completedBtn = screen.getByRole('button', { name: /Concluídas/i });
    fireEvent.click(completedBtn);
    
    // Subtask 1 não está concluída, então não deve aparecer
    expect(screen.queryByText('Subtask 1')).not.toBeInTheDocument();
  });
});
