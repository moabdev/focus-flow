import { StudySession } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { STORAGE_KEYS } from '@/features/core/api/storageDefaults';

export class StorageSessionsService {
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
}

export const storageSessionsService = new StorageSessionsService();
