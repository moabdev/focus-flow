import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, DEFAULT_SETTINGS } from '../services/storage';
import { Task, StudySession } from '../types';

describe('StorageService (Persistência Offline LocalStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve carregar tarefas vazias por padrão', () => {
    const tasks = storageService.getLocalTasks();
    expect(tasks).toEqual([]);
  });

  it('deve salvar e recuperar tarefas no localStorage', async () => {
    const task: Task = {
      id: 't-test-1',
      title: 'Estudar Estruturas de Dados',
      discipline: 'Algoritmos',
      pomodoros_estimated: 3,
      pomodoros_completed: 1,
      is_completed: false,
      priority: 'alta',
    };

    await storageService.saveTask(task);
    const tasks = storageService.getLocalTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Estudar Estruturas de Dados');
    expect(tasks[0].discipline).toBe('Algoritmos');
  });

  it('deve atualizar uma tarefa existente', async () => {
    const task: Task = {
      id: 't-test-1',
      title: 'Tarefa Original',
      discipline: 'Geral',
      pomodoros_estimated: 2,
      pomodoros_completed: 0,
      is_completed: false,
      priority: 'baixa',
    };

    await storageService.saveTask(task);
    const updated: Task = { ...task, title: 'Tarefa Atualizada', is_completed: true };
    await storageService.saveTask(updated);

    const tasks = storageService.getLocalTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Tarefa Atualizada');
    expect(tasks[0].is_completed).toBe(true);
  });

  it('deve deletar uma tarefa por ID', async () => {
    const task1: Task = {
      id: 't-1',
      title: 'Tarefa 1',
      discipline: 'Geral',
      pomodoros_estimated: 1,
      pomodoros_completed: 0,
      is_completed: false,
      priority: 'media',
    };
    const task2: Task = {
      id: 't-2',
      title: 'Tarefa 2',
      discipline: 'Geral',
      pomodoros_estimated: 1,
      pomodoros_completed: 0,
      is_completed: false,
      priority: 'media',
    };

    await storageService.saveTask(task1);
    await storageService.saveTask(task2);
    expect(storageService.getLocalTasks().length).toBe(2);

    await storageService.deleteTask('t-1');
    const remaining = storageService.getLocalTasks();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('t-2');
  });

  it('deve registrar e recuperar sessões de estudo', async () => {
    const session: StudySession = {
      id: 's-1',
      discipline: 'Python',
      duration_minutes: 25,
      completed_at: new Date().toISOString(),
    };

    await storageService.recordSession(session);
    const sessions = storageService.getLocalSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0].discipline).toBe('Python');
    expect(sessions[0].duration_minutes).toBe(25);
  });

  it('deve retornar configurações padrão quando nada foi salvo', () => {
    const settings = storageService.getSettings();
    expect(settings.pomodoro_time).toBe(DEFAULT_SETTINGS.pomodoro_time);
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it('deve salvar e carregar notas rápidas do scratchpad', async () => {
    await storageService.saveScratchpad('Minhas anotações de foco');
    expect(storageService.getScratchpad()).toBe('Minhas anotações de foco');
  });

  describe('Exclusão de Dados Pessoais no Logout (clearAllUserData)', () => {
    it('deve purgar todos os dados pessoais do navegador sem repovoar com mocks no refresh', async () => {
      // 1. Simula dados do usuário no localStorage
      await storageService.saveProject({
        id: 'user-proj-1',
        title: 'Meu Projeto Pessoal',
        color: '#ff5500',
        icon: '🚀',
        total_elapsed_seconds: 120,
        created_at: new Date().toISOString(),
      });
      await storageService.saveSubtask({
        id: 'user-sub-1',
        project_id: 'user-proj-1',
        title: 'Minha Subtarefa',
        pomodoros_estimated: 2,
        pomodoros_completed: 1,
        elapsed_seconds: 60,
        is_completed: false,
        priority: 'alta',
      });
      await storageService.recordSession({
        id: 'sess-1',
        discipline: 'Cálculo',
        duration_minutes: 25,
        completed_at: new Date().toISOString(),
      });
      await storageService.saveScratchpad('Rascunho ultra secreto');
      storageService.createQuickNote({ title: 'Nota rápida', content: 'Info privada' });
      storageService.saveMantras(['Persistência é a chave']);
      localStorage.setItem('sb-123-auth-token', JSON.stringify({ access_token: 'fake-jwt' }));

      // 2. Executa a limpeza completa
      storageService.clearAllUserData();

      // 3. Verifica se todos os dados pessoais foram purgados
      expect(storageService.getLocalProjects()).toEqual([]);
      expect(storageService.getLocalSubtasks()).toEqual([]);
      expect(storageService.getLocalTasks()).toEqual([]);
      expect(storageService.getLocalCalendarEvents()).toEqual([]);
      expect(storageService.getLocalSessions()).toEqual([]);
      expect(storageService.getScratchpad()).toBe('');
      expect(storageService.getQuickNotes()).toEqual([]);
      expect(storageService.getMantras()).toEqual([]);
      expect(localStorage.getItem('sb-123-auth-token')).toBeNull();

      // 4. Garante que INITIALIZED está setado como 'true' para que initDefaults() NÃO repovoe projetos com mock
      expect(storageService.isInitialized()).toBe(true);
      storageService.initDefaults();
      expect(storageService.getLocalProjects()).toEqual([]);
      expect(storageService.getLocalSubtasks()).toEqual([]);
    });
  });
});
