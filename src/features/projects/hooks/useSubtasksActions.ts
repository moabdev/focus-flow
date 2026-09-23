import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Subtask, PriorityLevel } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';

interface UseSubtasksActionsProps {
  subtasks: Subtask[];
  setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>;
  activeSubtaskId: string | null;
  setActiveSubtaskId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useSubtasksActions({
  subtasks,
  setSubtasks,
  activeSubtaskId,
  setActiveSubtaskId,
}: UseSubtasksActionsProps) {
  const createSubtask = useCallback(
    async (
      projectId: string,
      title: string,
      discipline: string = 'Geral',
      estimated: number = 1,
      priority: PriorityLevel = 'media',
      notes: string = '',
      due_date?: string
    ) => {
      if (!title.trim()) return null;
      const newSubtask: Subtask = {
        id: `sub-${Date.now()}`,
        project_id: projectId,
        title: title.trim(),
        discipline: discipline.trim() || 'Geral',
        pomodoros_estimated: Math.max(1, estimated),
        pomodoros_completed: 0,
        elapsed_seconds: 0,
        is_completed: false,
        priority,
        notes: notes.trim(),
        due_date,
        created_at: new Date().toISOString(),
      };
      const updated = [newSubtask, ...subtasks];
      setSubtasks(updated);
      if (!activeSubtaskId) setActiveSubtaskId(newSubtask.id);
      await storageService.saveSubtask(newSubtask);
      return newSubtask;
    },
    [subtasks, setSubtasks, activeSubtaskId, setActiveSubtaskId]
  );

  const updateSubtask = useCallback(
    async (id: string, updates: Partial<Subtask>) => {
      const index = subtasks.findIndex((s) => s.id === id);
      if (index === -1) return;
      const updatedSubtask = { ...subtasks[index], ...updates };
      const updatedList = [...subtasks];
      updatedList[index] = updatedSubtask;
      setSubtasks(updatedList);
      await storageService.saveSubtask(updatedSubtask);
    },
    [subtasks, setSubtasks]
  );

  const toggleSubtaskCompleted = useCallback(
    async (id: string) => {
      const target = subtasks.find((s) => s.id === id);
      if (!target) return;
      const nextCompleted = !target.is_completed;
      const updatedSubtask: Subtask = { ...target, is_completed: nextCompleted };

      if (nextCompleted) {
        try {
          confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
        } catch {}
      }

      const updatedList = subtasks.map((s) => (s.id === id ? updatedSubtask : s));
      setSubtasks(updatedList);
      await storageService.saveSubtask(updatedSubtask);
    },
    [subtasks, setSubtasks]
  );

  const incrementPomodoro = useCallback(
    async (subtaskId: string) => {
      const target = subtasks.find((s) => s.id === subtaskId);
      if (!target) return;
      const updatedSubtask: Subtask = {
        ...target,
        pomodoros_completed: target.pomodoros_completed + 1,
      };
      const updatedList = subtasks.map((s) => (s.id === subtaskId ? updatedSubtask : s));
      setSubtasks(updatedList);
      await storageService.saveSubtask(updatedSubtask);
    },
    [subtasks, setSubtasks]
  );

  return {
    createSubtask,
    updateSubtask,
    toggleSubtaskCompleted,
    incrementPomodoro,
  };
}
