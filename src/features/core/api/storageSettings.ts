import { UserSettings, QuickNote } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/features/core/api/storageDefaults';

export class StorageSettingsService {
  // CONFIGURAÇÕES
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

  // SCRATCHPAD
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

  // QUICK NOTES
  public getQuickNotes(): QuickNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
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

  // MANTRAS
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
}

export const storageSettingsService = new StorageSettingsService();
