import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { storageService } from '../services/storage';
import { Scratchpad } from '../components/Scratchpad';
import { Project, Subtask } from '../types';

describe('Sistema de Notas Rápidas / Rascunhos Vinculados (CRUD & Linking)', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-eng',
      title: 'Engenharia de Software',
      color: '#ff2a5f',
      icon: '⚙️',
      total_elapsed_seconds: 1200,
      created_at: '2026-09-20T10:00:00Z',
    },
    {
      id: 'proj-mat',
      title: 'Cálculo Diferencial',
      color: '#3b82f6',
      icon: '📐',
      total_elapsed_seconds: 3600,
      created_at: '2026-09-20T10:00:00Z',
    },
  ];

  const mockSubtasks: Subtask[] = [
    {
      id: 'sub-1',
      project_id: 'proj-eng',
      title: 'Arquitetura de Microsserviços',
      priority: 'alta',
      pomodoros_estimated: 4,
      pomodoros_completed: 2,
      is_completed: false,
      created_at: '2026-09-20T10:00:00Z',
    },
    {
      id: 'sub-2',
      project_id: 'proj-mat',
      title: 'Teorema Fundamental do Cálculo',
      priority: 'media',
      pomodoros_estimated: 3,
      pomodoros_completed: 0,
      is_completed: false,
      created_at: '2026-09-20T10:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('StorageService - Operações CRUD de Quick Notes', () => {
    it('deve inicializar com uma nota padrão ou migrar o scratchpad legado', () => {
      localStorage.setItem('focusflow_scratchpad', 'Ideias antigas de estudo');

      const notes = storageService.getQuickNotes();
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].content).toBe('Ideias antigas de estudo');
    });

    it('deve criar uma nova nota rápida com sucesso', () => {
      const newNote = storageService.createQuickNote({
        title: 'Dúvidas de Banco de Dados',
        content: 'Indexação B-Tree vs Hash',
        project_id: 'proj-eng',
      });

      expect(newNote.id).toBeDefined();
      expect(newNote.title).toBe('Dúvidas de Banco de Dados');
      expect(newNote.project_id).toBe('proj-eng');

      const all = storageService.getQuickNotes();
      expect(all.some((n) => n.id === newNote.id)).toBe(true);
    });

    it('deve atualizar o título, conteúdo e vínculos de uma nota', () => {
      const created = storageService.createQuickNote({
        title: 'Rascunho Inicial',
        content: 'Conteúdo inicial',
      });

      const updated = storageService.updateQuickNote(created.id, {
        title: 'Rascunho Revisado',
        content: 'Conteúdo detalhado com fórmulas',
        project_id: 'proj-mat',
        subtask_id: 'sub-2',
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Rascunho Revisado');
      expect(updated?.content).toBe('Conteúdo detalhado com fórmulas');
      expect(updated?.project_id).toBe('proj-mat');
      expect(updated?.subtask_id).toBe('sub-2');

      const loaded = storageService.getQuickNotes().find((n) => n.id === created.id);
      expect(loaded?.title).toBe('Rascunho Revisado');
      expect(loaded?.subtask_id).toBe('sub-2');
    });

    it('deve excluir uma nota rápida e manter integridade', () => {
      const noteA = storageService.createQuickNote({ title: 'Nota A' });
      const noteB = storageService.createQuickNote({ title: 'Nota B' });

      storageService.deleteQuickNote(noteA.id);

      const remaining = storageService.getQuickNotes();
      expect(remaining.some((n) => n.id === noteA.id)).toBe(false);
      expect(remaining.some((n) => n.id === noteB.id)).toBe(true);
    });
  });

  describe('Componente Scratchpad - Interface e Interações', () => {
    it('não deve renderizar quando isOpen for false', () => {
      const { container } = render(
        <Scratchpad isOpen={false} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('deve renderizar a gaveta quando isOpen for true com título e abas de notas', () => {
      render(
        <Scratchpad isOpen={true} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );

      expect(screen.getByRole('complementary', { name: /Notas Rápidas/i })).toBeInTheDocument();
      expect(screen.getByText('Rascunho & Notas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nova Nota/i })).toBeInTheDocument();
    });

    it('deve permitir criar um novo rascunho clicando em "+ Nova Nota"', () => {
      render(
        <Scratchpad isOpen={true} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );

      const newBtn = screen.getByRole('button', { name: /Nova Nota/i });
      fireEvent.click(newBtn);

      const notes = storageService.getQuickNotes();
      expect(notes.length).toBeGreaterThan(1);
    });

    it('deve permitir alterar o título e vincular a um projeto e subtarefa', () => {
      render(
        <Scratchpad isOpen={true} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );

      // Altera o título
      const titleInput = screen.getByPlaceholderText('Título do rascunho...');
      fireEvent.change(titleInput, { target: { value: 'Minhas Fórmulas de Cálculo' } });
      expect(titleInput).toHaveValue('Minhas Fórmulas de Cálculo');

      // Seleciona o projeto Cálculo Diferencial
      const projectSelect = screen.getByLabelText('Vincular a Projeto');
      fireEvent.change(projectSelect, { target: { value: 'proj-mat' } });
      expect(projectSelect).toHaveValue('proj-mat');

      // Seleciona a subtarefa do cálculo
      const subtaskSelect = screen.getByLabelText('Vincular a Subtarefa');
      fireEvent.change(subtaskSelect, { target: { value: 'sub-2' } });
      expect(subtaskSelect).toHaveValue('sub-2');
    });

    it('deve permitir excluir a nota ativa ao confirmar', () => {
      storageService.createQuickNote({ title: 'Nota para Deletar', content: 'Apagar' });

      render(
        <Scratchpad isOpen={true} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );

      const deleteBtn = screen.getByLabelText('Excluir nota');
      fireEvent.click(deleteBtn);

      // Deve exibir botão de confirmação
      const confirmBtn = screen.getByRole('button', { name: 'Excluir?' });
      expect(confirmBtn).toBeInTheDocument();

      fireEvent.click(confirmBtn);
      // Confirmação realizada
    });

    it('deve renderizar o botão de transcrição por voz (Ditado)', () => {
      render(
        <Scratchpad isOpen={true} onClose={vi.fn()} projects={mockProjects} subtasks={mockSubtasks} />
      );

      const micBtn = screen.getByLabelText('Ditado por voz');
      expect(micBtn).toBeInTheDocument();

      // Clica no microfone
      fireEvent.click(micBtn);
    });
  });
});
