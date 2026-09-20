import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncService } from '../services/syncService';
import { supabaseService } from '../services/supabase';
import { storageService } from '../services/storage';
import { Project, SupabaseProfile } from '../types';

describe('SyncService (Sincronização Automática em Background com Supabase)', () => {
  const mockUser: SupabaseProfile = {
    id: 'user-123',
    email: 'estudante@focusflow.app',
    full_name: 'Estudante Focado',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    syncService.init(null);
  });

  it('deve iniciar com status idle quando nenhum usuário estiver autenticado', () => {
    const status = syncService.getStatus();
    expect(status.status).toBe('idle');
    expect(status.lastSyncedAt).toBeNull();
    expect(status.errorMessage).toBeNull();
  });

  it('deve notificar assinantes de status através de subscribeStatus', () => {
    const listener = vi.fn();
    const unsubscribe = syncService.subscribeStatus(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'idle',
      })
    );

    unsubscribe();
  });

  it('não deve disparar sincronização se scheduleSync for chamado sem usuário autenticado', () => {
    vi.useFakeTimers();
    const syncAllSpy = vi.spyOn(syncService, 'syncAll');

    syncService.scheduleSync(500);
    vi.advanceTimersByTime(600);

    expect(syncAllSpy).not.toHaveBeenCalled();
    syncAllSpy.mockRestore();
    vi.useRealTimers();
  });

  it('deve debouncar chamadas consecutivas de scheduleSync quando autenticado', () => {
    vi.useFakeTimers();
    const syncAllSpy = vi.spyOn(syncService, 'syncAll').mockResolvedValue(true);

    // Simula inicialização com usuário
    // Mock do client e getUser
    vi.spyOn(supabaseService, 'getClient').mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as any);
    vi.spyOn(supabaseService, 'getUser').mockResolvedValue({ id: 'user-123' } as any);

    syncService.init(mockUser);
    syncAllSpy.mockClear();

    // Dispara vários agendamentos seguidos
    syncService.scheduleSync(1000);
    syncService.scheduleSync(1000);
    syncService.scheduleSync(1000);

    vi.advanceTimersByTime(500);
    expect(syncAllSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(600);
    expect(syncAllSpy).toHaveBeenCalledTimes(1);

    syncAllSpy.mockRestore();
    vi.useRealTimers();
  });

  it('deve executar syncAll com sucesso, persistir dados mesclados e notificar onDataSynced', async () => {
    // 1. Prepara dados locais
    const localProj: Project = {
      id: 'proj-local-1',
      title: 'Projeto Local Offline',
      color: '#ff2a5f',
      icon: '📁',
      total_elapsed_seconds: 100,
      created_at: new Date().toISOString(),
    };
    storageService.saveLocalProjects([localProj]);

    // 2. Mock do Supabase retornando projeto remoto diferente
    const remoteProj: Project = {
      id: 'proj-remote-2',
      title: 'Projeto Remoto da Nuvem',
      color: '#3b82f6',
      icon: '🚀',
      total_elapsed_seconds: 200,
      created_at: new Date().toISOString(),
    };

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [remoteProj], error: null }),
      }),
    });

    const mockQueryBuilder = {
      data: [],
      error: null,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    vi.spyOn(supabaseService, 'getClient').mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            upsert: mockUpsert,
            select: mockSelect,
          };
        }
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ...mockQueryBuilder,
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }),
    } as any);
    vi.spyOn(supabaseService, 'getUser').mockResolvedValue({ id: 'user-123' } as any);

    // 3. Registra ouvinte de dados sincronizados
    const onDataSyncedSpy = vi.fn();
    const unsubData = syncService.onDataSynced(onDataSyncedSpy);

    // 4. Inicializa o serviço e executa syncAll
    const success = await syncService.init(mockUser);

    expect(success).toBe(true);
    expect(syncService.getStatus().status).toBe('synced');
    expect(syncService.getStatus().lastSyncedAt).toBeInstanceOf(Date);
    expect(onDataSyncedSpy).toHaveBeenCalled();

    // 5. Verifica se a fusão manteve o projeto local e incluiu o projeto remoto
    const mergedProjects = storageService.getLocalProjects();
    expect(mergedProjects.some((p) => p.id === 'proj-local-1')).toBe(true);
    expect(mergedProjects.some((p) => p.id === 'proj-remote-2')).toBe(true);

    unsubData();
  });

  it('deve definir status de erro graciosamente quando houver falha de rede/Supabase sem corromper dados locais', async () => {
    const localProj: Project = {
      id: 'proj-seguro-1',
      title: 'Meu Projeto Preservado',
      color: '#ff2a5f',
      icon: '🛡️',
      total_elapsed_seconds: 50,
      created_at: new Date().toISOString(),
    };
    storageService.saveLocalProjects([localProj]);

    // Mock falha no Supabase
    vi.spyOn(supabaseService, 'getClient').mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockRejectedValue(new Error('Network connection timeout')),
      }),
    } as any);
    vi.spyOn(supabaseService, 'getUser').mockResolvedValue({ id: 'user-123' } as any);

    const success = await syncService.init(mockUser);

    expect(success).toBe(false);
    expect(syncService.getStatus().status).toBe('error');
    expect(syncService.getStatus().errorMessage).toContain('Network connection timeout');

    // Dados locais permanecem intactos
    expect(storageService.getLocalProjects().length).toBe(1);
    expect(storageService.getLocalProjects()[0].id).toBe('proj-seguro-1');
  });
});
