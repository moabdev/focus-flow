// Camada Híbrida de Persistência (Supabase Cloud + LocalStorage Offline First)
import { Project, Subtask, Task, CalendarEvent, StudySession, UserSettings, QuickNote } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECTS,
  DEFAULT_SUBTASKS,
  DEFAULT_CALENDAR_EVENTS,
} from '@/features/core/api/storageDefaults';
import { storageProjectsService, StorageProjectsService } from '@/features/projects/api/storageProjects';
import { storageCalendarService, StorageCalendarService } from '@/features/calendar/api/storageCalendar';
import { storageFlashcardsService, StorageFlashcardsService } from '@/features/flashcards/api/storageFlashcards';
import { storageMindMapsService, StorageMindMapsService } from '@/features/mindmaps/api/storageMindMaps';
import { StorageBackupService } from '@/features/core/api/storageBackup';
import { storageSettingsService, StorageSettingsService } from '@/features/core/api/storageSettings';
import { storageSessionsService, StorageSessionsService } from '@/features/timer/api/storageSessions';

export { DEFAULT_SETTINGS, DEFAULT_PROJECTS, DEFAULT_SUBTASKS, DEFAULT_CALENDAR_EVENTS };

export class StorageService {
  private projectsService: StorageProjectsService = storageProjectsService;
  private calendarService: StorageCalendarService = storageCalendarService;
  public flashcardsService: StorageFlashcardsService = storageFlashcardsService;
  public mindMapsService: StorageMindMapsService = storageMindMapsService;
  private settingsService: StorageSettingsService = storageSettingsService;
  private sessionsService: StorageSessionsService = storageSessionsService;
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
      getFlashcardDecks: () => this.flashcardsService.getLocalDecks(),
      saveFlashcardDecks: (d) => this.flashcardsService.saveLocalDecks(d),
      getFlashcards: () => this.flashcardsService.getLocalCards(),
      saveFlashcards: (c) => this.flashcardsService.saveLocalCards(c),
      getMindMaps: () => this.mindMapsService.getLocalMindMaps(),
      saveMindMaps: (m) => this.mindMapsService.saveLocalMindMaps(m),
    });
  }

  public isInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  }

  public markInitialized(): void {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  public initDefaults(force: boolean = false): void {
    if (this.isInitialized() && !force) {
      return;
    }
    this.markInitialized();

    if (this.getLocalProjects().length === 0) {
      this.saveLocalProjects(DEFAULT_PROJECTS);
    }
    if (this.getLocalSubtasks().length === 0) {
      this.saveLocalSubtasks(DEFAULT_SUBTASKS);
    }
    if (this.getLocalCalendarEvents().length === 0) {
      this.saveLocalCalendarEvents(DEFAULT_CALENDAR_EVENTS);
    }
    if (this.flashcardsService.getLocalDecks().length === 0) {
      this.flashcardsService.getLocalDecks(); // aciona os defaults
    }
    if (this.mindMapsService.getLocalMindMaps().length === 0) {
      this.mindMapsService.getLocalMindMaps(); // aciona os defaults
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

  public flushPendingRemoteSync(): void {
    this.projectsService.flushPendingRemoteSync();
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
    return this.sessionsService.getLocalSessions();
  }

  public saveLocalSessions(sessions: StudySession[]): void {
    this.sessionsService.saveLocalSessions(sessions);
  }

  public fetchSessions(): Promise<StudySession[]> {
    return this.sessionsService.fetchSessions();
  }

  public saveSession(session: StudySession): Promise<StudySession> {
    return this.sessionsService.saveSession(session);
  }

  public recordSession(session: StudySession): Promise<StudySession> {
    return this.sessionsService.recordSession(session);
  }

  // 5. CONFIGURAÇÕES, NOTAS RÁPIDAS E MANTRAS
  public getSettings(): UserSettings {
    return this.settingsService.getSettings();
  }

  public saveSettings(settings: UserSettings): void {
    this.settingsService.saveSettings(settings);
  }

  public getScratchpad(): string {
    return this.settingsService.getScratchpad();
  }

  public saveScratchpad(content: string): void {
    this.settingsService.saveScratchpad(content);
  }

  public getQuickNotes(): QuickNote[] {
    return this.settingsService.getQuickNotes();
  }

  public saveQuickNotes(notes: QuickNote[]): void {
    this.settingsService.saveQuickNotes(notes);
  }

  public createQuickNote(data?: Partial<QuickNote>): QuickNote {
    return this.settingsService.createQuickNote(data);
  }

  public updateQuickNote(id: string, updates: Partial<QuickNote>): QuickNote | null {
    return this.settingsService.updateQuickNote(id, updates);
  }

  public deleteQuickNote(id: string): void {
    this.settingsService.deleteQuickNote(id);
  }

  public fetchQuickNotes(): Promise<QuickNote[]> {
    return this.settingsService.fetchQuickNotes();
  }

  public getMantras(): string[] {
    return this.settingsService.getMantras();
  }

  public saveMantras(mantras: string[]): void {
    this.settingsService.saveMantras(mantras);
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

  /**
   * Remove e zera todos os dados pessoais do usuário no navegador (LocalStorage e SessionStorage).
   * Garante privacidade absoluta ao realizar logout.
   */
  public clearAllUserData(): void {
    const keysToRemove = [
      STORAGE_KEYS.PROJECTS,
      STORAGE_KEYS.SUBTASKS,
      STORAGE_KEYS.TASKS,
      STORAGE_KEYS.CALENDAR,
      STORAGE_KEYS.SESSIONS,
      STORAGE_KEYS.SCRATCHPAD,
      STORAGE_KEYS.QUICK_NOTES,
      STORAGE_KEYS.MANTRAS,
      'focusflow_unlocked_badges',
      'focusflow_study_groups',
      'focusflow_group_members',
      'focusflow_group_messages',
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    // Define listas vazias explícitas e mantém INITIALIZED = true para evitar repovoamento com mocks
    try {
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      localStorage.setItem(STORAGE_KEYS.PROJECTS, '[]');
      localStorage.setItem(STORAGE_KEYS.SUBTASKS, '[]');
      localStorage.setItem(STORAGE_KEYS.TASKS, '[]');
      localStorage.setItem(STORAGE_KEYS.CALENDAR, '[]');
      localStorage.setItem(STORAGE_KEYS.SESSIONS, '[]');
      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, '[]');
      localStorage.setItem(STORAGE_KEYS.SCRATCHPAD, '');
      localStorage.setItem(STORAGE_KEYS.MANTRAS, '[]');
    } catch {}

    // Limpa tokens de autenticação do Supabase residuais no localStorage
    try {
      const keysToPurge: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
          keysToPurge.push(key);
        }
      }
      keysToPurge.forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      sessionStorage.clear();
    } catch {}
  }
}

export const storageService = new StorageService();
