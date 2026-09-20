// Camada Híbrida de Persistência (Supabase Cloud + LocalStorage Offline First)
import { Task, StudySession, UserSettings } from '../types';
import { supabaseService } from './supabase';

const STORAGE_KEYS = {
  TASKS: 'focusflow_tasks',
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

export class StorageService {
  // --- Tarefas ---
  public getLocalTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveLocalTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  public async fetchTasks(): Promise<Task[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          this.saveLocalTasks(data as Task[]);
          return data as Task[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar tarefas na nuvem:', err);
      }
    }

    return this.getLocalTasks();
  }

  public async saveTask(task: Task): Promise<Task> {
    const tasks = this.getLocalTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);

    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.unshift(task);
    }
    this.saveLocalTasks(tasks);

    // Sincroniza na nuvem se autenticado
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('tasks').upsert({
          id: task.id,
          user_id: user.id,
          title: task.title,
          discipline: task.discipline,
          pomodoros_estimated: task.pomodoros_estimated,
          pomodoros_completed: task.pomodoros_completed,
          is_completed: task.is_completed,
          priority: task.priority,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar tarefa no Supabase:', err);
      }
    }

    return task;
  }

  public async deleteTask(taskId: string): Promise<void> {
    const tasks = this.getLocalTasks().filter((t) => t.id !== taskId);
    this.saveLocalTasks(tasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar tarefa no Supabase:', err);
      }
    }
  }

  // --- Histórico de Sessões de Estudo ---
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

  public async recordSession(session: StudySession): Promise<void> {
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
          duration_minutes: session.duration_minutes,
          completed_at: session.completed_at,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao registrar sessão no Supabase:', err);
      }
    }
  }

  // --- Configurações ---
  public getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('user_settings').upsert({
          user_id: user.id,
          pomodoro_time: settings.pomodoro_time,
          short_break_time: settings.short_break_time,
          long_break_time: settings.long_break_time,
          long_break_interval: settings.long_break_interval,
          theme: settings.theme,
          color_mode: settings.color_mode,
          dark_mode_running: settings.dark_mode_running,
          alarm_sound: settings.alarm_sound,
          ambient_sound: settings.ambient_sound,
          sound_volume: settings.sound_volume,
          auto_start_breaks: settings.auto_start_breaks,
          auto_start_pomodoros: settings.auto_start_pomodoros,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar configurações no Supabase:', err);
      }
    }
  }

  // --- Bloco de Notas Rápidas (Scratchpad) ---
  public getScratchpad(): string {
    return localStorage.getItem(STORAGE_KEYS.SCRATCHPAD) || '';
  }

  public async saveScratchpad(content: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, content);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('scratchpad').upsert({
          user_id: user.id,
          content,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar scratchpad no Supabase:', err);
      }
    }
  }

  // --- Mantras / Metas Pessoais ---
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

  // --- Migração: Sincronizar dados locais com a conta nuvem recém logada ---
  public async syncLocalToCloud(): Promise<{ count: number }> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (!client || !user) return { count: 0 };

    let count = 0;
    const localTasks = this.getLocalTasks();
    for (const t of localTasks) {
      await client.from('tasks').upsert({
        id: t.id,
        user_id: user.id,
        title: t.title,
        discipline: t.discipline,
        pomodoros_estimated: t.pomodoros_estimated,
        pomodoros_completed: t.pomodoros_completed,
        is_completed: t.is_completed,
        priority: t.priority,
      });
      count++;
    }

    const localSessions = this.getLocalSessions();
    for (const s of localSessions) {
      await client.from('study_sessions').upsert({
        id: s.id,
        user_id: user.id,
        discipline: s.discipline,
        duration_minutes: s.duration_minutes,
        completed_at: s.completed_at,
      });
      count++;
    }

    return { count };
  }

  // --- Exportar & Importar Backup em JSON ---
  public exportBackupJSON(): void {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
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
    link.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
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
