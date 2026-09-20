import { supabaseService } from './supabase';
import { storageService } from './storage';
import {
  CloudSyncStatus,
  CloudSyncInfo,
  SupabaseProfile,
  Project,
  Subtask,
  CalendarEvent,
  QuickNote,
  StudySession,
} from '../types';

class SyncService {
  private status: CloudSyncStatus = 'idle';
  private lastSyncedAt: Date | null = null;
  private errorMessage: string | null = null;
  private statusListeners: Array<(info: CloudSyncInfo) => void> = [];
  private dataSyncedListeners: Array<() => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private currentUser: SupabaseProfile | null = null;
  private isWindowListenersAttached: boolean = false;
  private inFlightPromise: Promise<boolean> | null = null;

  constructor() {
    this.setupWindowListeners();
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  }

  private setupWindowListeners(): void {
    if (typeof window === 'undefined' || this.isWindowListenersAttached) return;

    window.addEventListener('online', () => {
      if (this.currentUser) {
        this.syncAll();
      } else {
        this.setStatus('idle');
      }
    });

    window.addEventListener('offline', () => {
      this.setStatus('offline');
    });

    window.addEventListener('focus', () => {
      if (this.currentUser && this.isOnline() && this.status !== 'syncing') {
        this.syncAll();
      }
    });

    this.isWindowListenersAttached = true;
  }

  private setStatus(status: CloudSyncStatus, errorMessage: string | null = null): void {
    this.status = status;
    this.errorMessage = errorMessage;
    this.notifyStatus();
  }

  private notifyStatus(): void {
    const info = this.getStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(info);
      } catch (err) {
        console.error('[SyncService] Erro no listener de status:', err);
      }
    });
  }

  private notifyDataSynced(): void {
    this.dataSyncedListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[SyncService] Erro no listener de dados:', err);
      }
    });
  }

  public getStatus(): CloudSyncInfo {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.errorMessage,
    };
  }

  public subscribeStatus(listener: (info: CloudSyncInfo) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public onDataSynced(listener: () => void): () => void {
    this.dataSyncedListeners.push(listener);
    return () => {
      this.dataSyncedListeners = this.dataSyncedListeners.filter((l) => l !== listener);
    };
  }

  public async init(userProfile: SupabaseProfile | null): Promise<boolean> {
    this.currentUser = userProfile;

    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }

    if (!userProfile) {
      this.setStatus('idle');
      return false;
    }

    if (!this.isOnline()) {
      this.setStatus('offline');
      return false;
    }

    // Configura sincronização periódica a cada 5 minutos
    this.periodicTimer = setInterval(() => {
      if (this.currentUser && this.isOnline() && this.status !== 'syncing') {
        this.syncAll();
      }
    }, 5 * 60 * 1000);

    // Dispara sincronização inicial com a nuvem
    return await this.syncAll();
  }

  public scheduleSync(delayMs: number = 2500): void {
    if (!this.currentUser) return;

    if (!this.isOnline()) {
      this.setStatus('offline');
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.syncAll();
    }, delayMs);
  }

  /**
   * Executa a sincronização bidirecional completa:
   * 1. Envia registros locais para a nuvem (Push).
   * 2. Baixa registros remotos da nuvem e mescla com os locais (Pull & Merge).
   * 3. Notifica a interface do usuário para atualização reativa instantânea.
   */
  public async syncAll(): Promise<boolean> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = this.executeSync();
    try {
      return await this.inFlightPromise;
    } finally {
      this.inFlightPromise = null;
    }
  }

  private async executeSync(): Promise<boolean> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (!client || !user || !this.currentUser) {
      this.setStatus('idle');
      return false;
    }

    if (!this.isOnline()) {
      this.setStatus('offline');
      return false;
    }

    this.setStatus('syncing');

    try {
      // -------------------------------------------------------------
      // FASE 1: PUSH (Enviar dados locais para o Supabase)
      // -------------------------------------------------------------
      const localProjects = storageService.getLocalProjects();
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
      }

      const localSubtasks = storageService.getLocalSubtasks();
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
      }

      const localEvents = storageService.getLocalCalendarEvents();
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
      }

      const localNotes = storageService.getQuickNotes();
      for (const n of localNotes) {
        await client.from('quick_notes').upsert({
          id: n.id,
          user_id: user.id,
          title: n.title || 'Nova Anotação',
          content: n.content || '',
          project_id: n.project_id || null,
          subtask_id: n.subtask_id || null,
          created_at: n.created_at,
          updated_at: n.updated_at,
        });
      }

      const localSessions = storageService.getLocalSessions();
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
      }

      // -------------------------------------------------------------
      // FASE 2: PULL & MERGE (Buscar registros remotos e mesclar)
      // -------------------------------------------------------------
      // 1. Projetos
      const { data: remoteProjects, error: errProjects } = await client
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!errProjects && remoteProjects) {
        const mergedProjects = this.mergeById(localProjects, remoteProjects as Project[]);
        storageService.saveLocalProjects(mergedProjects);
      }

      // 2. Subtarefas
      const { data: remoteSubtasks, error: errSubtasks } = await client
        .from('subtasks')
        .select('*')
        .eq('user_id', user.id);

      if (!errSubtasks && remoteSubtasks) {
        const mergedSubtasks = this.mergeById(localSubtasks, remoteSubtasks as Subtask[]);
        storageService.saveLocalSubtasks(mergedSubtasks);
      }

      // 3. Calendário
      const { data: remoteEvents, error: errEvents } = await client
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (!errEvents && remoteEvents) {
        const mergedEvents = this.mergeById(localEvents, remoteEvents as CalendarEvent[]);
        storageService.saveLocalCalendarEvents(mergedEvents);
      }

      // 4. Notas Rápidas
      const { data: remoteNotes, error: errNotes } = await client
        .from('quick_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!errNotes && remoteNotes) {
        const mergedNotes = this.mergeById(localNotes, remoteNotes as QuickNote[]);
        storageService.saveQuickNotes(mergedNotes);
      }

      // 5. Sessões de Estudo
      const { data: remoteSessions, error: errSessions } = await client
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (!errSessions && remoteSessions) {
        const mergedSessions = this.mergeById(localSessions, remoteSessions as StudySession[]);
        storageService.saveLocalSessions(mergedSessions);
      }

      // -------------------------------------------------------------
      // FASE 3: NOTIFICAR HOOKS E ATUALIZAR STATUS
      // -------------------------------------------------------------
      this.lastSyncedAt = new Date();
      this.setStatus('synced');
      this.notifyDataSynced();
      return true;
    } catch (err: unknown) {
      console.warn('[SyncService] Falha durante sincronização com Supabase:', err);
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar com a nuvem';
      this.setStatus('error', message);
      return false;
    }
  }

  /**
   * Fusão inteligente de coleções baseada em ID:
   * Preserva itens locais já existentes e incorpora novos itens remotos.
   */
  private mergeById<T extends { id: string }>(localList: T[], remoteList: T[]): T[] {
    const map = new Map<string, T>();
    // Itens remotos como base
    remoteList.forEach((item) => map.set(item.id, item));
    // Itens locais mesclados / sobrescrevendo se mais recentes
    localList.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }
}

export const syncService = new SyncService();
