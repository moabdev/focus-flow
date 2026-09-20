import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/storage';
import { Project, Subtask, CalendarEvent } from '../types';

describe('Projetos, Subtasks e Time-Tracking Acumulado', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve criar um projeto com metadados completos', async () => {
    const project: Project = {
      id: 'proj-test-1',
      title: 'Ciência de Dados & Machine Learning',
      description: 'Especialização em modelos preditivos e LLMs',
      start_date: '2026-09-01',
      end_date: '2026-12-31',
      color: '#0ea5e9',
      icon: '🧠',
      total_elapsed_seconds: 0,
      created_at: new Date().toISOString(),
    };

    await storageService.saveProject(project);

    const loaded = storageService.getLocalProjects();
    expect(loaded.length).toBe(1);
    expect(loaded[0].title).toBe('Ciência de Dados & Machine Learning');
    expect(loaded[0].icon).toBe('🧠');
    expect(loaded[0].start_date).toBe('2026-09-01');
    expect(loaded[0].end_date).toBe('2026-12-31');
    expect(loaded[0].color).toBe('#0ea5e9');
  });

  it('deve criar subtasks vinculadas ao projeto com anotações Notion', async () => {
    const subtask: Subtask = {
      id: 'sub-test-1',
      project_id: 'proj-test-1',
      title: 'Fine-tuning de Llama 3',
      discipline: 'Inteligência Artificial',
      priority: 'alta',
      pomodoros_estimated: 4,
      pomodoros_completed: 0,
      elapsed_seconds: 0,
      is_completed: false,
      notes: '# Guia de Fine-Tuning\n- [ ] Preparar dataset JSONL\n> 💡 Use LoRA para economia de VRAM',
      created_at: new Date().toISOString(),
    };

    await storageService.saveSubtask(subtask);

    const loaded = storageService.getLocalSubtasks();
    expect(loaded.length).toBe(1);
    expect(loaded[0].title).toBe('Fine-tuning de Llama 3');
    expect(loaded[0].project_id).toBe('proj-test-1');
    expect(loaded[0].notes).toContain('# Guia de Fine-Tuning');
    expect(loaded[0].notes).toContain('- [ ] Preparar dataset JSONL');
  });

  it('deve acumular o tempo decorrido na subtask e refletir no total_elapsed_seconds do projeto', async () => {
    const project: Project = {
      id: 'proj-test-time',
      title: 'Projeto Engenharia',
      color: '#ff2a5f',
      total_elapsed_seconds: 0,
      created_at: new Date().toISOString(),
    };
    await storageService.saveProject(project);

    const subtask: Subtask = {
      id: 'sub-test-time',
      project_id: 'proj-test-time',
      title: 'Modelagem SQL',
      priority: 'alta',
      pomodoros_estimated: 2,
      pomodoros_completed: 0,
      elapsed_seconds: 0,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    await storageService.saveSubtask(subtask);

    // Adiciona 1500 segundos (25 minutos) de foco na subtask
    const result1 = await storageService.addTimeSpent('sub-test-time', 1500);
    expect(result1.subtask?.elapsed_seconds).toBe(1500);
    expect(result1.project?.total_elapsed_seconds).toBe(1500);

    // Adiciona mais 600 segundos (10 minutos)
    const result2 = await storageService.addTimeSpent('sub-test-time', 600);
    expect(result2.subtask?.elapsed_seconds).toBe(2100);
    expect(result2.project?.total_elapsed_seconds).toBe(2100);

    // Valida persistência no LocalStorage
    const savedProjects = storageService.getLocalProjects();
    const savedSubtasks = storageService.getLocalSubtasks();
    expect(savedProjects.find((p) => p.id === 'proj-test-time')?.total_elapsed_seconds).toBe(2100);
    expect(savedSubtasks.find((s) => s.id === 'sub-test-time')?.elapsed_seconds).toBe(2100);
  });

  it('deve gerenciar eventos de calendário vinculados a projetos e horários', async () => {
    const event: CalendarEvent = {
      id: 'cal-event-1',
      title: 'Bloco de Foco Matinal',
      description: 'Revisão de algoritmos',
      start_time: '2026-09-20T09:00',
      end_time: '2026-09-20T10:30',
      project_id: 'proj-test-1',
      subtask_id: 'sub-test-1',
      color: '#0ea5e9',
      is_completed: false,
    };

    await storageService.saveCalendarEvent(event);

    const loaded = storageService.getLocalCalendarEvents();
    expect(loaded.length).toBe(1);
    expect(loaded[0].title).toBe('Bloco de Foco Matinal');
    expect(loaded[0].start_time).toBe('2026-09-20T09:00');
    expect(loaded[0].project_id).toBe('proj-test-1');

    // Conclui o evento
    await storageService.toggleCalendarEventCompleted('cal-event-1');
    const updated = storageService.getLocalCalendarEvents();
    expect(updated[0].is_completed).toBe(true);

    // Remove o evento
    await storageService.deleteCalendarEvent('cal-event-1');
    expect(storageService.getLocalCalendarEvents().length).toBe(0);
  });

  it('deve persistir a exclusão de todos os projetos e não recriar os mocks ao reinicializar', async () => {
    // 1. Inicializa os defaults
    storageService.initDefaults();
    expect(storageService.getLocalProjects().length).toBeGreaterThan(0);
    expect(storageService.isInitialized()).toBe(true);

    // 2. Deleta todos os projetos
    const projects = storageService.getLocalProjects();
    for (const p of projects) {
      await storageService.deleteProject(p.id);
    }

    // 3. Garante que a lista local está vazia
    expect(storageService.getLocalProjects().length).toBe(0);

    // 4. Simula recarregar a página (chama initDefaults novamente)
    storageService.initDefaults();

    // 5. Os projetos mockados NÃO devem ter sido recriados!
    expect(storageService.getLocalProjects().length).toBe(0);
    const fetched = await storageService.fetchProjects();
    expect(fetched.length).toBe(0);
  });
});
