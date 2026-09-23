import { supabaseService } from '@/features/core/api/supabase';
import { storageService } from '@/features/core/api/storage';
import { CloudSyncStatus, CloudSyncInfo, SupabaseProfile } from '@/features/core/types';

import { pushProjects, pullProjects, pushSubtasks, pullSubtasks } from '@/features/projects/api/syncProjectsWorker';
import { pushCalendarEvents, pullCalendarEvents } from '@/features/calendar/api/syncCalendarWorker';
import { pushQuickNotes, pullQuickNotes } from '@/features/core/api/syncNotesWorker';
import { pushSessions, pullSessions } from '@/features/timer/api/syncSessionsWorker';
import { pushFlashcards, pullFlashcards } from '@/features/flashcards/api/syncFlashcardsWorker';
import { pushMindMaps, pullMindMaps } from '@/features/mindmaps/api/syncMindMapsWorker';

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
      await pushProjects(client, user.id, storageService.getLocalProjects());
      await pushSubtasks(client, user.id, storageService.getLocalSubtasks());
      await pushCalendarEvents(client, user.id, storageService.getLocalCalendarEvents());
      await pushQuickNotes(client, user.id, storageService.getQuickNotes());
      await pushSessions(client, user.id, storageService.getLocalSessions());
      await pushFlashcards(client, user.id);
      await pushMindMaps(client, user.id);

      // -------------------------------------------------------------
      // FASE 2: PULL & MERGE (Buscar registros remotos e mesclar)
      // -------------------------------------------------------------
      await pullProjects(client, user.id, storageService.getLocalProjects());
      await pullSubtasks(client, user.id, storageService.getLocalSubtasks());
      await pullCalendarEvents(client, user.id, storageService.getLocalCalendarEvents());
      await pullQuickNotes(client, user.id, storageService.getQuickNotes());
      await pullSessions(client, user.id, storageService.getLocalSessions());
      await pullFlashcards(client, user.id);
      await pullMindMaps(client, user.id);

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

}

export const syncService = new SyncService();
