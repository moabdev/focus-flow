import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotionNoteEditor } from '../../features/notion/components/NotionNoteEditor';
import { Subtask, Project } from '../../features/core/types';
import { ToastProvider } from '../../features/core/contexts/ToastContext';

describe('NotionNoteEditor Component', () => {
  const mockSubtask: Subtask = {
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
    notes: 'Alguma nota',
  };

  const mockProject: Project = {
    id: 'p1',
    title: 'Project 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    subtask: mockSubtask,
    project: mockProject,
    onSaveNotes: vi.fn(),
  };

  it('não deve renderizar se isOpen for falso', () => {
    const { container } = render(
      <ToastProvider>
        <NotionNoteEditor {...defaultProps} isOpen={false} />
      </ToastProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('deve renderizar o editor com o título da subtask', () => {
    render(
      <ToastProvider>
        <NotionNoteEditor {...defaultProps} />
      </ToastProvider>
    );
    expect(screen.getByText(/Subtask 1/i)).toBeInTheDocument();
  });
});
