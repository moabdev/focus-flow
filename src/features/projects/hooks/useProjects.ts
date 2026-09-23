import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, Subtask } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';
import { useProjectsActions } from './useProjectsActions';
import { useSubtasksActions } from './useSubtasksActions';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'todos'>('todos');
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshProjects = useCallback(() => {
    const loadedProjects = storageService.getLocalProjects();
    const loadedSubtasks = storageService.getLocalSubtasks();
    setProjects(loadedProjects);
    setSubtasks(loadedSubtasks);
    setActiveSubtaskId((prev) => {
      if (prev && loadedSubtasks.some((s) => s.id === prev)) return prev;
      const firstPending = loadedSubtasks.find((s) => !s.is_completed);
      return firstPending ? firstPending.id : (loadedSubtasks[0]?.id || null);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = syncService.onDataSynced(() => {
      refreshProjects();
    });
    return () => unsubscribe();
  }, [refreshProjects]);

  useEffect(() => {
    Promise.all([
      storageService.fetchProjects(),
      storageService.fetchSubtasks(),
    ]).then(([loadedProjects, loadedSubtasks]) => {
      if (!storageService.isInitialized()) {
        if (loadedProjects.length === 0 && loadedSubtasks.length === 0) {
          storageService.initDefaults();
          const defProjects = storageService.getLocalProjects();
          const defSubtasks = storageService.getLocalSubtasks();
          setProjects(defProjects);
          setSubtasks(defSubtasks);
          if (defSubtasks.length > 0) {
            setActiveSubtaskId(defSubtasks[0].id);
          }
          return;
        } else {
          storageService.markInitialized();
        }
      }

      setProjects(loadedProjects);
      setSubtasks(loadedSubtasks);

      const firstPending = loadedSubtasks.find((s) => !s.is_completed);
      if (firstPending) {
        setActiveSubtaskId(firstPending.id);
      } else if (loadedSubtasks.length > 0) {
        setActiveSubtaskId(loadedSubtasks[0].id);
      } else {
        setActiveSubtaskId(null);
      }
    });
  }, []);

  const activeSubtask = useMemo(
    () => subtasks.find((s) => s.id === activeSubtaskId) || null,
    [subtasks, activeSubtaskId]
  );

  const activeProject = useMemo(
    () => (activeSubtask ? projects.find((p) => p.id === activeSubtask.project_id) || null : null),
    [projects, activeSubtask]
  );

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    subtasks.forEach((s) => {
      if (s.discipline) set.add(s.discipline);
    });
    return Array.from(set);
  }, [subtasks]);

  const { createProject, updateProject } = useProjectsActions({
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
  });

  const { createSubtask, updateSubtask, toggleSubtaskCompleted, incrementPomodoro } = useSubtasksActions({
    subtasks,
    setSubtasks,
    activeSubtaskId,
    setActiveSubtaskId,
  });

  const deleteProject = useCallback(
    async (id: string) => {
      const updatedProjects = projects.filter((p) => p.id !== id);
      const updatedSubtasks = subtasks.filter((s) => s.project_id !== id);
      setProjects(updatedProjects);
      setSubtasks(updatedSubtasks);

      if (selectedProjectId === id) setSelectedProjectId('todos');
      if (activeSubtask && activeSubtask.project_id === id) {
        const next = updatedSubtasks.find((s) => !s.is_completed) || updatedSubtasks[0] || null;
        setActiveSubtaskId(next ? next.id : null);
      }
      await storageService.deleteProject(id);
    },
    [projects, subtasks, selectedProjectId, activeSubtask]
  );

  const deleteSubtask = useCallback(
    async (id: string) => {
      const updated = subtasks.filter((s) => s.id !== id);
      setSubtasks(updated);
      if (activeSubtaskId === id) {
        const next = updated.find((s) => !s.is_completed) || updated[0] || null;
        setActiveSubtaskId(next ? next.id : null);
      }
      await storageService.deleteSubtask(id);
    },
    [subtasks, activeSubtaskId]
  );

  const addTimeSpent = useCallback(
    async (subtaskId: string, seconds: number) => {
      if (seconds <= 0) return;
      const result = await storageService.addTimeSpent(subtaskId, seconds);
      if (result.subtask) {
        setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? result.subtask! : s)));
      }
      if (result.project) {
        setProjects((prev) => prev.map((p) => (p.id === result.project!.id ? result.project! : p)));
      }
    },
    []
  );

  const filteredSubtasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return subtasks.filter((sub) => {
      if (selectedProjectId !== 'todos' && sub.project_id !== selectedProjectId) return false;
      if (filterStatus === 'pendentes' && sub.is_completed) return false;
      if (filterStatus === 'concluidas' && !sub.is_completed) return false;
      if (query) {
        const matchesTitle = sub.title.toLowerCase().includes(query);
        const matchesNotes = (sub.notes || '').toLowerCase().includes(query);
        const matchesDiscipline = (sub.discipline || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesDiscipline) return false;
      }
      return true;
    });
  }, [subtasks, selectedProjectId, filterStatus, searchQuery]);

  const clearProjects = useCallback(() => {
    setProjects([]);
    setSubtasks([]);
    setActiveSubtaskId(null);
  }, []);

  return {
    projects,
    subtasks,
    filteredSubtasks,
    selectedProjectId,
    setSelectedProjectId,
    activeSubtask,
    activeSubtaskId,
    setActiveSubtaskId,
    activeProject,
    disciplines,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    createProject,
    updateProject,
    deleteProject,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskCompleted,
    addTimeSpent,
    incrementPomodoro,
    clearProjects,
    refreshProjects,
  };
}
