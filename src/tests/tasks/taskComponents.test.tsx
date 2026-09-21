import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '@/features/tasks/components/TaskForm';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { TaskList } from '@/features/tasks/components/TaskList';
import { Task } from '@/features/core/types';

describe('Task Components', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Estudar Testes',
    discipline: 'Programação',
    priority: 'alta',
    pomodoros_estimated: 4,
    pomodoros_completed: 1,
    is_completed: false,
    created_at: '',
  };

  describe('TaskItem', () => {
    it('deve renderizar informações da tarefa', () => {
      render(
        <TaskItem
          task={mockTask}
          isActive={false}
          onSelectActiveTask={vi.fn()}
          onToggleTaskCompleted={vi.fn()}
          onDeleteTask={vi.fn()}
        />
      );

      expect(screen.getByText('Estudar Testes')).toBeInTheDocument();
      expect(screen.getByText('Programação')).toBeInTheDocument();
      expect(screen.getByText('alta')).toBeInTheDocument();
      expect(screen.getByTitle('1 de 4 ciclos concluídos')).toBeInTheDocument(); // Pomodoros
    });

    it('deve chamar callbacks ao interagir', () => {
      const onSelect = vi.fn();
      const onToggle = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(
        <TaskItem
          task={mockTask}
          isActive={false}
          onSelectActiveTask={onSelect}
          onToggleTaskCompleted={onToggle}
          onDeleteTask={onDelete}
        />
      );

      // Clicar para completar (primeiro botão à esquerda)
      const completeBtn = container.querySelector('.task-check-btn');
      if (completeBtn) fireEvent.click(completeBtn);
      expect(onToggle).toHaveBeenCalledWith('1');

      // Clicar para ativar (clicando no título ou na área central)
      const selectBtn = container.querySelector('.task-details');
      if (selectBtn) fireEvent.click(selectBtn);
      expect(onSelect).toHaveBeenCalledWith('1');

      // Clicar para deletar (último botão à direita)
      const deleteBtn = container.querySelector('button[aria-label="Excluir"]');
      if (deleteBtn) fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('TaskForm', () => {
    it('deve renderizar campos e chamar onSubmit', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      const onCancel = vi.fn();
      
      render(
        <TaskForm
          newTitle="Nova"
          setNewTitle={vi.fn()}
          newDiscipline="Ciência"
          setNewDiscipline={vi.fn()}
          newEstimated={2}
          setNewEstimated={vi.fn()}
          newPriority="media"
          setNewPriority={vi.fn()}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Verifica se existe o input
      expect(screen.getByPlaceholderText(/O que voc/i)).toBeInTheDocument();
      
      // Botões Salvar e Cancelar
      const saveBtn = screen.getByText('Salvar Tarefa');
      fireEvent.click(saveBtn);
      expect(onSubmit).toHaveBeenCalled();

      const cancelBtn = screen.getByText('Cancelar');
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('TaskList', () => {
    const listProps = {
      tasks: [mockTask],
      activeTaskId: null,
      onSelectActiveTask: vi.fn(),
      onToggleTaskCompleted: vi.fn(),
      onDeleteTask: vi.fn(),
      onAddTask: vi.fn(),
      disciplines: ['Programação', 'Matemática'],
      filterDiscipline: 'todas',
      onSelectFilterDiscipline: vi.fn(),
      filterStatus: 'todas' as const,
      onSelectFilterStatus: vi.fn(),
    };

    it('deve renderizar a lista de tarefas', () => {
      render(<TaskList {...listProps} />);
      expect(screen.getByText('Estudar Testes')).toBeInTheDocument();
    });

    it('deve permitir abrir o formulário para adicionar tarefa', () => {
      render(<TaskList {...listProps} />);
      
      // Botão Nova Tarefa tem o texto "Nova Tarefa"
      const novaTarefaBtn = screen.getByText('Adicionar Tarefa de Estudo');
      fireEvent.click(novaTarefaBtn);

      // Deve exibir o formulário que tem o texto "Cancelar" ou placeholder "Ex: Estudar Matemática"
      expect(screen.getByPlaceholderText(/O que voc/i)).toBeInTheDocument();
    });
  });
});
