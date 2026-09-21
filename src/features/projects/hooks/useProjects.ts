import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Project, Subtask, PriorityLevel } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';

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

  // Escuta atualizações de sincronização em nuvem
  useEffect(() => {
    const unsubscribe = syncService.onDataSynced(() => {
      refreshProjects();
    });
    return () => unsubscribe();
  }, [refreshProjects]);

  // Carrega projetos e subtasks no início
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

  // Operações com Projetos
  const createProject = useCallback(
    async (data: {
      title: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      color?: string;
      icon?: string;
    }) => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        color: data.color || '#ff2a5f',
        icon: data.icon || '📁',
        total_elapsed_seconds: 0,
        created_at: new Date().toISOString(),
      };
      const updated = [newProject, ...projects];
      setProjects(updated);
      await storageService.saveProject(newProject);
      return newProject;
    },
    [projects]
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) return;
      const updatedProject = { ...projects[index], ...updates };
      const updatedList = [...projects];
      updatedList[index] = updatedProject;
      setProjects(updatedList);
      await storageService.saveProject(updatedProject);
    },
    [projects]
  );

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

  // Operações com Subtasks
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
    [subtasks, activeSubtaskId]
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
    [subtasks]
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

  const toggleSubtaskCompleted = useCallback(
    async (id: string) => {
      const target = subtasks.find((s) => s.id === id);
      if (!target) return;
      const nextCompleted = !target.is_completed;
      const updatedSubtask: Subtask = { ...target, is_completed: nextCompleted };

      if (nextCompleted) {
        try {
          confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignora caso não suporte canvas
        }
      }

      const updatedList = subtasks.map((s) => (s.id === id ? updatedSubtask : s));
      setSubtasks(updatedList);
      await storageService.saveSubtask(updatedSubtask);
    },
    [subtasks]
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
    [subtasks]
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
