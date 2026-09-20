import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Task, PriorityLevel } from '../types';
import { storageService } from '../services/storage';

const DEFAULT_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Engenharia de Dados: Modelagem e Pipelines SQL',
    discipline: 'Engenharia de Dados',
    pomodoros_estimated: 4,
    pomodoros_completed: 2,
    is_completed: false,
    priority: 'alta',
  },
  {
    id: 't-2',
    title: 'Python, RAG & Agentes Autônomos com LangChain',
    discipline: 'Inteligência Artificial',
    pomodoros_estimated: 6,
    pomodoros_completed: 1,
    is_completed: false,
    priority: 'alta',
  },
  {
    id: 't-3',
    title: 'Java Spring Boot: Endpoints REST e DTOs',
    discipline: 'Backend Java',
    pomodoros_estimated: 3,
    pomodoros_completed: 3,
    is_completed: true,
    priority: 'media',
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [filterDiscipline, setFilterDiscipline] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');

  // Carrega tarefas no início
  useEffect(() => {
    storageService.fetchTasks().then((loaded) => {
      if (loaded.length > 0) {
        setTasks(loaded);
        const firstPending = loaded.find((t) => !t.is_completed);
        if (firstPending) setActiveTaskId(firstPending.id);
      } else if (!storageService.isInitialized()) {
        // Inicializa com as tarefas de exemplo apenas na primeiríssima visita
        storageService.saveLocalTasks(DEFAULT_TASKS);
        storageService.markInitialized();
        setTasks(DEFAULT_TASKS);
        setActiveTaskId(DEFAULT_TASKS[0].id);
      } else {
        setTasks([]);
        setActiveTaskId(null);
      }
    });
  }, []);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  const addTask = useCallback(async (
    title: string,
    discipline: string = 'Geral',
    estimated: number = 1,
    priority: PriorityLevel = 'media'
  ) => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      discipline: discipline.trim() || 'Geral',
      pomodoros_estimated: Math.max(1, estimated),
      pomodoros_completed: 0,
      is_completed: false,
      priority,
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    await storageService.saveTask(newTask);
  }, [tasks, activeTaskId]);

  const toggleTaskCompleted = useCallback(async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.is_completed;
    const updatedTask: Task = { ...target, is_completed: nextCompleted };

    if (nextCompleted) {
      // Efeito festivo de celebração
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#e63956', '#4cc9f0', '#06d6a0', '#ffd166'],
        });
      } catch {
        // Confetti fallback
      }
    }

    const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
    setTasks(updatedList);
    await storageService.saveTask(updatedTask);
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    if (activeTaskId === id) {
      const remaining = updated.find((t) => !t.is_completed);
      setActiveTaskId(remaining ? remaining.id : null);
    }
    await storageService.deleteTask(id);
  }, [tasks, activeTaskId]);

  const incrementPomodoro = useCallback(async (taskId?: string) => {
    const targetId = taskId || activeTaskId;
    if (!targetId) return;

    const target = tasks.find((t) => t.id === targetId);
    if (!target) return;

    const updatedTask: Task = {
      ...target,
      pomodoros_completed: target.pomodoros_completed + 1,
    };

    const updatedList = tasks.map((t) => (t.id === targetId ? updatedTask : t));
    setTasks(updatedList);
    await storageService.saveTask(updatedTask);
  }, [tasks, activeTaskId]);

  // Extrai lista única de disciplinas para filtro
  const disciplines = Array.from(new Set(tasks.map((t) => t.discipline))).filter(Boolean);

  // Tarefas filtradas
  const filteredTasks = tasks.filter((t) => {
    if (filterDiscipline !== 'todas' && t.discipline !== filterDiscipline) {
      return false;
    }
    if (filterStatus === 'pendentes' && t.is_completed) return false;
    if (filterStatus === 'concluidas' && !t.is_completed) return false;
    return true;
  });

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    activeTask,
    activeTaskId,
    setActiveTaskId,
    addTask,
    toggleTaskCompleted,
    deleteTask,
    incrementPomodoro,
    disciplines,
    filterDiscipline,
    setFilterDiscipline,
    filterStatus,
    setFilterStatus,
  };
}
