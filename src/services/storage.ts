// Camada Híbrida de Persistência (Supabase Cloud + LocalStorage Offline First)
import { Project, Subtask, Task, CalendarEvent, StudySession, UserSettings, QuickNote } from '../types';
import { supabaseService } from './supabase';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECTS,
  DEFAULT_SUBTASKS,
  DEFAULT_CALENDAR_EVENTS,
} from './storageDefaults';
import { storageProjectsService, StorageProjectsService } from './storageProjects';
import { storageCalendarService, StorageCalendarService } from './storageCalendar';
import { StorageBackupService } from './storageBackup';

export { DEFAULT_SETTINGS, DEFAULT_PROJECTS, DEFAULT_SUBTASKS, DEFAULT_CALENDAR_EVENTS };

export class StorageService {
  private projectsService: StorageProjectsService = storageProjectsService;
  private calendarService: StorageCalendarService = storageCalendarService;
  private backupService: StorageBackupService;

  constructor() {
    this.backupService = new StorageBackupService({
      projectsService: this.projectsService,
      calendarService: this.calendarService,
      getSettings: () => this.getSettings(),
      saveSettings: (s) => this.saveSettings(s),
      getScratchpad: () => this.getScratchpad(),
      saveScratchpad: (s) => this.saveScratchpad(s),
      getMantras: () => this.getMantras(),
      saveMantras: (m) => this.saveMantras(m),
      getLocalSessions: () => this.getLocalSessions(),
      saveLocalSessions: (s) => this.saveLocalSessions(s),
      getQuickNotes: () => this.getQuickNotes(),
      saveQuickNotes: (n) => this.saveQuickNotes(n),
    });
  }

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

  // 1. PROJETOS
  public getLocalProjects(): Project[] {
    return this.projectsService.getLocalProjects();
  }

  public saveLocalProjects(projects: Project[]): void {
    this.projectsService.saveLocalProjects(projects);
  }

  public fetchProjects(): Promise<Project[]> {
    return this.projectsService.fetchProjects();
  }

  public saveProject(project: Project): Promise<Project> {
    return this.projectsService.saveProject(project);
  }

  public deleteProject(projectId: string): Promise<void> {
    return this.projectsService.deleteProject(projectId);
  }

  // 2. SUBTASKS & TAREFAS
  public getLocalSubtasks(): Subtask[] {
    return this.projectsService.getLocalSubtasks();
  }

  public saveLocalSubtasks(subtasks: Subtask[]): void {
    this.projectsService.saveLocalSubtasks(subtasks);
  }

  public fetchSubtasks(): Promise<Subtask[]> {
    return this.projectsService.fetchSubtasks();
  }

  public saveSubtask(subtask: Subtask): Promise<Subtask> {
    return this.projectsService.saveSubtask(subtask);
  }

  public deleteSubtask(subtaskId: string): Promise<void> {
    return this.projectsService.deleteSubtask(subtaskId);
  }

  public addTimeSpent(
    subtaskId: string,
    seconds: number
  ): Promise<{ subtask: Subtask | null; project: Project | null }> {
    return this.projectsService.addTimeSpent(subtaskId, seconds);
  }

  public getLocalTasks(): Task[] {
    return this.projectsService.getLocalTasks();
  }

  public saveLocalTasks(tasks: Task[]): void {
    this.projectsService.saveLocalTasks(tasks);
  }

  public fetchTasks(): Promise<Task[]> {
    return this.projectsService.fetchTasks();
  }

  public saveTask(task: Task): Promise<Task> {
    return this.projectsService.saveTask(task);
  }

  public deleteTask(taskId: string): Promise<void> {
    return this.projectsService.deleteTask(taskId);
  }

  // 3. CALENDÁRIO
  public getLocalCalendarEvents(): CalendarEvent[] {
    return this.calendarService.getLocalCalendarEvents();
  }

  public saveLocalCalendarEvents(events: CalendarEvent[]): void {
    this.calendarService.saveLocalCalendarEvents(events);
  }

  public fetchCalendarEvents(): Promise<CalendarEvent[]> {
    return this.calendarService.fetchCalendarEvents();
  }

  public saveCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
    return this.calendarService.saveCalendarEvent(event);
  }

  public toggleCalendarEventCompleted(eventId: string): Promise<CalendarEvent | null> {
    return this.calendarService.toggleCalendarEventCompleted(eventId);
  }

  public deleteCalendarEvent(eventId: string): Promise<void> {
    return this.calendarService.deleteCalendarEvent(eventId);
  }

  // 4. SESSÕES DE ESTUDO
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

  public saveSession(session: StudySession): Promise<StudySession> {
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

  // 5. CONFIGURAÇÕES, NOTAS RÁPIDAS E MANTRAS
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (data) {
        const notes: QuickNote[] = JSON.parse(data);
        if (notes.length > 0) {
          notes[0].content = content;
          notes[0].updated_at = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(notes));
        }
      }
    } catch {}
  }

  // Métodos CRUD para Notas Rápidas / Rascunhos Vinculados
  public getQuickNotes(): QuickNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const legacy = this.getScratchpad();
    const initialNote: QuickNote = {
      id: 'note-1',
      title: 'Anotações Rápidas',
      content: legacy || '',
      project_id: null,
      subtask_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const initialList = [initialNote];
    this.saveQuickNotes(initialList);
    return initialList;
  }

  public saveQuickNotes(notes: QuickNote[]): void {
    localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(notes));
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, notes[0].content);
    }
  }

  public createQuickNote(data?: Partial<QuickNote>): QuickNote {
    const notes = this.getQuickNotes();
    const newNote: QuickNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data?.title?.trim() || 'Nova Anotação',
      content: data?.content || '',
      project_id: data?.project_id || null,
      subtask_id: data?.subtask_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newNote, ...notes];
    this.saveQuickNotes(updated);

    const client = supabaseService.getClient();
    (async () => {
      try {
        const user = await supabaseService.getUser();
        if (client && user) {
          await client.from('quick_notes').upsert({
            id: newNote.id,
            user_id: user.id,
            title: newNote.title,
            content: newNote.content,
            project_id: newNote.project_id || null,
            subtask_id: newNote.subtask_id || null,
            created_at: newNote.created_at,
            updated_at: newNote.updated_at,
          });
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar nota no Supabase:', err);
      }
    })();

    return newNote;
  }

  public updateQuickNote(id: string, updates: Partial<QuickNote>): QuickNote | null {
    const notes = this.getQuickNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const updatedNote: QuickNote = {
      ...notes[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    notes[index] = updatedNote;
    this.saveQuickNotes(notes);

    const client = supabaseService.getClient();
    (async () => {
      try {
        const user = await supabaseService.getUser();
        if (client && user) {
          await client.from('quick_notes').upsert({
            id: updatedNote.id,
            user_id: user.id,
            title: updatedNote.title,
            content: updatedNote.content,
            project_id: updatedNote.project_id || null,
            subtask_id: updatedNote.subtask_id || null,
            created_at: updatedNote.created_at,
            updated_at: updatedNote.updated_at,
          });
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao atualizar nota no Supabase:', err);
      }
    })();

    return updatedNote;
  }

  public deleteQuickNote(id: string): void {
    const notes = this.getQuickNotes().filter((n) => n.id !== id);
    if (notes.length === 0) {
      const blank: QuickNote = {
        id: `note-${Date.now()}`,
        title: 'Nova Anotação',
        content: '',
        project_id: null,
        subtask_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.saveQuickNotes([blank]);
    } else {
      this.saveQuickNotes(notes);
    }

    const client = supabaseService.getClient();
    (async () => {
      try {
        const user = await supabaseService.getUser();
        if (client && user) {
          await client.from('quick_notes').delete().eq('id', id);
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar nota no Supabase:', err);
      }
    })();
  }

  public async fetchQuickNotes(): Promise<QuickNote[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (client && user) {
      try {
        const { data, error } = await client
          .from('quick_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteNotes: QuickNote[] = data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            title: d.title || 'Nova Anotação',
            content: d.content || '',
            project_id: d.project_id || null,
            subtask_id: d.subtask_id || null,
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));
          this.saveQuickNotes(remoteNotes);
          return remoteNotes;
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao buscar notas do Supabase:', err);
      }
    }
    return this.getQuickNotes();
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

  public syncLocalToCloud(): Promise<{ count: number }> {
    return this.backupService.syncLocalToCloud();
  }

  public exportBackupJSON(): void {
    this.backupService.exportBackupJSON();
  }

  public importBackupJSON(file: File): Promise<boolean> {
    return this.backupService.importBackupJSON(file);
  }
}

export const storageService = new StorageService();
