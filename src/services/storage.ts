// Camada Híbrida de Persistência (Supabase Cloud + LocalStorage Offline First)
import { Project, Subtask, Task, CalendarEvent, StudySession, UserSettings } from '../types';
import { supabaseService } from './supabase';

const STORAGE_KEYS = {
  PROJECTS: 'focusflow_projects',
  SUBTASKS: 'focusflow_subtasks',
  TASKS: 'focusflow_tasks', // legado
  CALENDAR: 'focusflow_calendar_events',
  SESSIONS: 'focusflow_sessions',
  SETTINGS: 'focusflow_settings',
  SCRATCHPAD: 'focusflow_scratchpad',
  MANTRAS: 'focusflow_mantras',
};

export const DEFAULT_SETTINGS: UserSettings = {
  pomodoro_time: 25,
  short_break_time: 5,
  long_break_time: 15,
  long_break_interval: 4,
  theme: 'ruby',
  color_mode: 'dark',
  dark_mode_running: true,
  alarm_sound: 'crystal',
  ambient_sound: 'none',
  sound_volume: 0.8,
  ambient_volume: 0.5,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'FocusFlow: Plataforma & Engenharia',
    description: 'Desenvolvimento do ecossistema moderno com timer, projetos, subtasks e calendário.',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    color: '#ff2a5f',
    icon: '🚀',
    total_elapsed_seconds: 5400, // 1h 30m
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    title: 'Inteligência Artificial & Agentes Autônomos',
    description: 'Estudos aprofundados de RAG multimodal, embeddings e fluxos agentic.',
    start_date: '2026-09-10',
    end_date: '2026-11-30',
    color: '#0ea5e9',
    icon: '🤖',
    total_elapsed_seconds: 3600, // 1h
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_SUBTASKS: Subtask[] = [
  {
    id: 'sub-1',
    project_id: 'proj-1',
    title: 'Arquitetura de Projetos e Time-Tracking por Subtask',
    discipline: 'Engenharia de Software',
    priority: 'alta',
    pomodoros_estimated: 4,
    pomodoros_completed: 2,
    elapsed_seconds: 3000,
    is_completed: false,
    notes: '# Planejamento da Arquitetura\n\n- [x] Modelagem de interfaces no TypeScript\n- [x] Rastreamento preciso de tempo em segundos\n- [ ] Conectar cronômetro ao tempo acumulado\n\n> 💡 *Dica:* Cada subtask acumula tempo individualmente e alimenta o total do projeto.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    project_id: 'proj-1',
    title: 'Editor de Anotações estilo Notion com Markdown',
    discipline: 'Frontend UX',
    priority: 'alta',
    pomodoros_estimated: 3,
    pomodoros_completed: 1,
    elapsed_seconds: 2400,
    is_completed: false,
    notes: '# Requisitos do Editor Notion-style\n\n- Tipografia refinada (JetBrains Mono & Outfit)\n- Checklists interativos clicáveis\n- Callouts com emoji e destaque visual',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub-3',
    project_id: 'proj-2',
    title: 'Implementação de RAG com Embeddings e Vector Store',
    discipline: 'Inteligência Artificial',
    priority: 'media',
    pomodoros_estimated: 5,
    pomodoros_completed: 2,
    elapsed_seconds: 3600,
    is_completed: false,
    notes: '# Pipeline de Recuperação\n\n1. Chunking contextual de documentos\n2. Indexação vetorial em alta dimensão\n3. Re-ranking semântico',
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Foco: Arquitetura FocusFlow',
    description: 'Desenvolvimento das novas abas de projetos e time-blocking',
    start_time: `${new Date().toISOString().split('T')[0]}T09:00`,
    end_time: `${new Date().toISOString().split('T')[0]}T10:30`,
    project_id: 'proj-1',
    subtask_id: 'sub-1',
    color: '#ff2a5f',
    is_completed: false,
  },
  {
    id: 'cal-2',
    title: 'Estudo: RAG & Vetores Semânticos',
    description: 'Leitura técnica e implementação de embeddings',
    start_time: `${new Date().toISOString().split('T')[0]}T14:00`,
    end_time: `${new Date().toISOString().split('T')[0]}T15:30`,
    project_id: 'proj-2',
    subtask_id: 'sub-3',
    color: '#0ea5e9',
    is_completed: false,
  },
];

export class StorageService {
  public initDefaults(): void {
    if (this.getLocalProjects().length === 0) {
      this.saveLocalProjects(DEFAULT_PROJECTS);
    }
    if (this.getLocalSubtasks().length === 0) {
      this.saveLocalSubtasks(DEFAULT_SUBTASKS);
    }
    if (this.getLocalCalendarEvents().length === 0) {
      this.saveLocalCalendarEvents(DEFAULT_CALENDAR_EVENTS);
    }
  }

  // =========================================================================
  // 1. PROJETOS
  // =========================================================================
  public getLocalProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public async fetchProjects(): Promise<Project[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          this.saveLocalProjects(data as Project[]);
          return data as Project[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar projetos do Supabase:', err);
      }
    }

    return this.getLocalProjects();
  }

  public async saveProject(project: Project): Promise<Project> {
    const projects = this.getLocalProjects();
    const index = projects.findIndex((p) => p.id === project.id);

    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    this.saveLocalProjects(projects);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('projects').upsert({
          id: project.id,
          user_id: user.id,
          title: project.title,
          description: project.description || '',
          start_date: project.start_date || null,
          end_date: project.end_date || null,
          color: project.color,
          icon: project.icon || '📁',
          total_elapsed_seconds: project.total_elapsed_seconds || 0,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar projeto no Supabase:', err);
      }
    }

    return project;
  }

  public async deleteProject(projectId: string): Promise<void> {
    const projects = this.getLocalProjects().filter((p) => p.id !== projectId);
    this.saveLocalProjects(projects);

    // Remove também as subtasks associadas
    const subtasks = this.getLocalSubtasks().filter((s) => s.project_id !== projectId);
    this.saveLocalSubtasks(subtasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('projects').delete().eq('id', projectId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar projeto no Supabase:', err);
      }
    }
  }

  // =========================================================================
  // 2. SUBTASKS (COM RASTREAMENTO DE TEMPO E NOTAS NOTION)
  // =========================================================================
  public getLocalSubtasks(): Subtask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBTASKS);
      if (data) {
        return JSON.parse(data);
      }

      // Migração de tarefas legadas (focusflow_tasks)
      const oldTasksData = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (oldTasksData) {
        try {
          const oldTasks: any[] = JSON.parse(oldTasksData);
          if (Array.isArray(oldTasks) && oldTasks.length > 0) {
            const defaultProjectId = this.getLocalProjects()[0]?.id || 'proj-1';
            const migrated: Subtask[] = oldTasks.map((t) => ({
              id: t.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              project_id: t.project_id || defaultProjectId,
              user_id: t.user_id,
              title: t.title || 'Tarefa',
              discipline: t.discipline || 'Geral',
              priority: t.priority || 'media',
              pomodoros_estimated: t.pomodoros_estimated || 1,
              pomodoros_completed: t.pomodoros_completed || 0,
              elapsed_seconds: t.elapsed_seconds || (t.pomodoros_completed || 0) * 25 * 60,
              is_completed: !!t.is_completed,
              notes: t.notes || '',
              due_date: t.due_date,
              created_at: t.created_at || new Date().toISOString(),
            }));
            this.saveLocalSubtasks(migrated);
            return migrated;
          }
        } catch {
          // fallback abaixo
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  public saveLocalSubtasks(subtasks: Subtask[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(subtasks));
    // Mantém espelho em TASKS para compatibilidade retroativa
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(subtasks));
  }

  public async fetchSubtasks(): Promise<Subtask[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('subtasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          this.saveLocalSubtasks(data as Subtask[]);
          return data as Subtask[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar subtasks do Supabase:', err);
      }
    }

    return this.getLocalSubtasks();
  }

  public async saveSubtask(subtask: Subtask): Promise<Subtask> {
    const subtasks = this.getLocalSubtasks();
    const index = subtasks.findIndex((s) => s.id === subtask.id);

    if (index >= 0) {
      subtasks[index] = subtask;
    } else {
      subtasks.unshift(subtask);
    }
    this.saveLocalSubtasks(subtasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('subtasks').upsert({
          id: subtask.id,
          project_id: subtask.project_id,
          user_id: user.id,
          title: subtask.title,
          discipline: subtask.discipline || 'Geral',
          priority: subtask.priority,
          pomodoros_estimated: subtask.pomodoros_estimated,
          pomodoros_completed: subtask.pomodoros_completed,
          elapsed_seconds: subtask.elapsed_seconds || 0,
          is_completed: subtask.is_completed,
          notes: subtask.notes || '',
          due_date: subtask.due_date || null,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar subtask no Supabase:', err);
      }
    }

    return subtask;
  }

  public async deleteSubtask(subtaskId: string): Promise<void> {
    const subtasks = this.getLocalSubtasks().filter((s) => s.id !== subtaskId);
    this.saveLocalSubtasks(subtasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('subtasks').delete().eq('id', subtaskId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar subtask no Supabase:', err);
      }
    }
  }

  // Monitora e adiciona tempo decorrido na subtask e no projeto correspondente
  public async addTimeSpent(
    subtaskId: string,
    seconds: number
  ): Promise<{ subtask: Subtask | null; project: Project | null }> {
    if (seconds <= 0) return { subtask: null, project: null };

    const subtasks = this.getLocalSubtasks();
    const subIndex = subtasks.findIndex((s) => s.id === subtaskId);
    if (subIndex === -1) return { subtask: null, project: null };

    const targetSubtask = subtasks[subIndex];
    targetSubtask.elapsed_seconds = (targetSubtask.elapsed_seconds || 0) + seconds;
    this.saveLocalSubtasks(subtasks);

    // Acumula também no projeto pai
    let targetProject: Project | null = null;
    const projects = this.getLocalProjects();
    const projIndex = projects.findIndex((p) => p.id === targetSubtask.project_id);

    if (projIndex >= 0) {
      targetProject = projects[projIndex];
      targetProject.total_elapsed_seconds = (targetProject.total_elapsed_seconds || 0) + seconds;
      this.saveLocalProjects(projects);
      this.saveProject(targetProject).catch(() => {});
    }

    this.saveSubtask(targetSubtask).catch(() => {});

    return { subtask: targetSubtask, project: targetProject };
  }

  // Delegados para compatibilidade retroativa
  public getLocalTasks(): Task[] {
    return this.getLocalSubtasks();
  }

  public saveLocalTasks(tasks: Task[]): void {
    this.saveLocalSubtasks(tasks as Subtask[]);
  }

  public async fetchTasks(): Promise<Task[]> {
    return this.fetchSubtasks();
  }

  public async saveTask(task: Task): Promise<Task> {
    return this.saveSubtask(task as Subtask);
  }

  public async deleteTask(taskId: string): Promise<void> {
    return this.deleteSubtask(taskId);
  }

  // =========================================================================
  // 3. CALENDÁRIO & TIME-BLOCKING
  // =========================================================================
  public getLocalCalendarEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalCalendarEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
  }

  public async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('calendar_events')
          .select('*')
          .order('start_time', { ascending: true });

        if (!error && data && data.length > 0) {
          this.saveLocalCalendarEvents(data as CalendarEvent[]);
          return data as CalendarEvent[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar calendário no Supabase:', err);
      }
    }

    return this.getLocalCalendarEvents();
  }

  public async saveCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const events = this.getLocalCalendarEvents();
    const index = events.findIndex((e) => e.id === event.id);

    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    this.saveLocalCalendarEvents(events);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('calendar_events').upsert({
          id: event.id,
          user_id: user.id,
          title: event.title,
          description: event.description || '',
          start_time: event.start_time,
          end_time: event.end_time,
          project_id: event.project_id || null,
          subtask_id: event.subtask_id || null,
          color: event.color || '#ff2a5f',
          is_completed: !!event.is_completed,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar evento no Supabase:', err);
      }
    }

    return event;
  }

  public async toggleCalendarEventCompleted(eventId: string): Promise<CalendarEvent | null> {
    const events = this.getLocalCalendarEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    event.is_completed = !event.is_completed;
    await this.saveCalendarEvent(event);
    return event;
  }

  public async deleteCalendarEvent(eventId: string): Promise<void> {
    const events = this.getLocalCalendarEvents().filter((e) => e.id !== eventId);
    this.saveLocalCalendarEvents(events);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('calendar_events').delete().eq('id', eventId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar evento no Supabase:', err);
      }
    }
  }

  // =========================================================================
  // 4. HISTÓRICO DE SESSÕES DE ESTUDO
  // =========================================================================
  public getLocalSessions(): StudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveLocalSessions(sessions: StudySession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  public async fetchSessions(): Promise<StudySession[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('study_sessions')
          .select('*')
          .order('completed_at', { ascending: false });

        if (!error && data) {
          this.saveLocalSessions(data as StudySession[]);
          return data as StudySession[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar sessões com Supabase:', err);
      }
    }

    return this.getLocalSessions();
  }

  public async saveSession(session: StudySession): Promise<StudySession> {
    return this.recordSession(session);
  }

  public async recordSession(session: StudySession): Promise<StudySession> {
    const sessions = this.getLocalSessions();
    sessions.unshift(session);
    this.saveLocalSessions(sessions);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('study_sessions').insert({
          id: session.id,
          user_id: user.id,
          discipline: session.discipline,
          project_id: session.project_id || null,
          subtask_id: session.subtask_id || null,
          duration_minutes: session.duration_minutes,
          completed_at: session.completed_at,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar sessão no Supabase:', err);
      }
    }

    return session;
  }

  // =========================================================================
  // 5. CONFIGURAÇÕES, NOTAS RÁPIDAS E MANTRAS
  // =========================================================================
  public getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  public getScratchpad(): string {
    return localStorage.getItem(STORAGE_KEYS.SCRATCHPAD) || '';
  }

  public saveScratchpad(content: string): void {
    localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, content);
  }

  public getMantras(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MANTRAS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveMantras(mantras: string[]): void {
    localStorage.setItem(STORAGE_KEYS.MANTRAS, JSON.stringify(mantras));
  }

  // Sincronização completa de tudo para a nuvem
  public async syncLocalToCloud(): Promise<{ count: number }> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (!client || !user) return { count: 0 };

    let count = 0;

    // Sincroniza projetos
    const localProjects = this.getLocalProjects();
    for (const p of localProjects) {
      await client.from('projects').upsert({
        id: p.id,
        user_id: user.id,
        title: p.title,
        description: p.description || '',
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        color: p.color,
        icon: p.icon || '📁',
        total_elapsed_seconds: p.total_elapsed_seconds || 0,
      });
      count++;
    }

    // Sincroniza subtasks
    const localSubtasks = this.getLocalSubtasks();
    for (const s of localSubtasks) {
      await client.from('subtasks').upsert({
        id: s.id,
        project_id: s.project_id,
        user_id: user.id,
        title: s.title,
        discipline: s.discipline || 'Geral',
        priority: s.priority,
        pomodoros_estimated: s.pomodoros_estimated,
        pomodoros_completed: s.pomodoros_completed,
        elapsed_seconds: s.elapsed_seconds || 0,
        is_completed: s.is_completed,
        notes: s.notes || '',
        due_date: s.due_date || null,
      });
      count++;
    }

    // Sincroniza sessões
    const localSessions = this.getLocalSessions();
    for (const s of localSessions) {
      await client.from('study_sessions').upsert({
        id: s.id,
        user_id: user.id,
        discipline: s.discipline,
        project_id: s.project_id || null,
        subtask_id: s.subtask_id || null,
        duration_minutes: s.duration_minutes,
        completed_at: s.completed_at,
      });
      count++;
    }

    // Sincroniza calendário
    const localEvents = this.getLocalCalendarEvents();
    for (const e of localEvents) {
      await client.from('calendar_events').upsert({
        id: e.id,
        user_id: user.id,
        title: e.title,
        description: e.description || '',
        start_time: e.start_time,
        end_time: e.end_time,
        project_id: e.project_id || null,
        subtask_id: e.subtask_id || null,
        color: e.color || '#ff2a5f',
        is_completed: !!e.is_completed,
      });
      count++;
    }

    return { count };
  }

  // =========================================================================
  // 6. BACKUP & RESTAURAÇÃO (JSON)
  // =========================================================================
  public exportBackupJSON(): void {
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.getLocalProjects(),
      subtasks: this.getLocalSubtasks(),
      calendarEvents: this.getLocalCalendarEvents(),
      tasks: this.getLocalTasks(),
      sessions: this.getLocalSessions(),
      settings: this.getSettings(),
      scratchpad: this.getScratchpad(),
      mantras: this.getMantras(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focusflow-backup-v2-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public importBackupJSON(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          if (data.projects && Array.isArray(data.projects)) {
            this.saveLocalProjects(data.projects);
          }
          if (data.subtasks && Array.isArray(data.subtasks)) {
            this.saveLocalSubtasks(data.subtasks);
          }
          if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
            this.saveLocalCalendarEvents(data.calendarEvents);
          }
          if (data.tasks && Array.isArray(data.tasks)) {
            this.saveLocalTasks(data.tasks);
          }
          if (data.sessions && Array.isArray(data.sessions)) {
            this.saveLocalSessions(data.sessions);
          }
          if (data.settings && typeof data.settings === 'object') {
            this.saveSettings(data.settings);
          }
          if (typeof data.scratchpad === 'string') {
            this.saveScratchpad(data.scratchpad);
          }
          if (data.mantras && Array.isArray(data.mantras)) {
            this.saveMantras(data.mantras);
          }

          resolve(true);
        } catch (err) {
          console.error('[FocusFlow] Erro ao restaurar backup JSON:', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }
}

export const storageService = new StorageService();
