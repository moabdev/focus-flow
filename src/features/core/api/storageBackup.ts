import { StorageProjectsService } from '@/features/projects/api/storageProjects';
import { StorageCalendarService } from '@/features/calendar/api/storageCalendar';
import { supabaseService } from '@/features/core/api/supabase';

export interface StorageContext {
  projectsService: StorageProjectsService;
  calendarService: StorageCalendarService;
  getSettings: () => any;
  saveSettings: (s: any) => void;
  getScratchpad: () => string;
  saveScratchpad: (s: string) => void;
  getMantras: () => string[];
  saveMantras: (m: string[]) => void;
  getLocalSessions: () => any[];
  saveLocalSessions: (s: any[]) => void;
  getQuickNotes?: () => any[];
  saveQuickNotes?: (notes: any[]) => void;
  getFlashcardDecks?: () => any[];
  saveFlashcardDecks?: (decks: any[]) => void;
  getFlashcards?: () => any[];
  saveFlashcards?: (cards: any[]) => void;
  getMindMaps?: () => any[];
  saveMindMaps?: (maps: any[]) => void;
}

export class StorageBackupService {
  constructor(private ctx: StorageContext) {}

  public exportBackupJSON(): void {
    const backupData = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      projects: this.ctx.projectsService.getLocalProjects(),
      subtasks: this.ctx.projectsService.getLocalSubtasks(),
      calendarEvents: this.ctx.calendarService.getLocalCalendarEvents(),
      tasks: this.ctx.projectsService.getLocalTasks(),
      sessions: this.ctx.getLocalSessions(),
      settings: this.ctx.getSettings(),
      scratchpad: this.ctx.getScratchpad(),
      quickNotes: this.ctx.getQuickNotes ? this.ctx.getQuickNotes() : [],
      flashcardDecks: this.ctx.getFlashcardDecks ? this.ctx.getFlashcardDecks() : [],
      flashcards: this.ctx.getFlashcards ? this.ctx.getFlashcards() : [],
      mindMaps: this.ctx.getMindMaps ? this.ctx.getMindMaps() : [],
      mantras: this.ctx.getMantras(),
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
            this.ctx.projectsService.saveLocalProjects(data.projects);
          }
          if (data.subtasks && Array.isArray(data.subtasks)) {
            this.ctx.projectsService.saveLocalSubtasks(data.subtasks);
          }
          if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
            this.ctx.calendarService.saveLocalCalendarEvents(data.calendarEvents);
          }
          if (data.tasks && Array.isArray(data.tasks)) {
            this.ctx.projectsService.saveLocalTasks(data.tasks);
          }
          if (data.sessions && Array.isArray(data.sessions)) {
            this.ctx.saveLocalSessions(data.sessions);
          }
          if (data.settings && typeof data.settings === 'object') {
            this.ctx.saveSettings(data.settings);
          }
          if (typeof data.scratchpad === 'string') {
            this.ctx.saveScratchpad(data.scratchpad);
          }
          if (data.quickNotes && Array.isArray(data.quickNotes) && this.ctx.saveQuickNotes) {
            this.ctx.saveQuickNotes(data.quickNotes);
          }
          if (data.flashcardDecks && Array.isArray(data.flashcardDecks) && this.ctx.saveFlashcardDecks) {
            this.ctx.saveFlashcardDecks(data.flashcardDecks);
          }
          if (data.flashcards && Array.isArray(data.flashcards) && this.ctx.saveFlashcards) {
            this.ctx.saveFlashcards(data.flashcards);
          }
          if (data.mindMaps && Array.isArray(data.mindMaps) && this.ctx.saveMindMaps) {
            this.ctx.saveMindMaps(data.mindMaps);
          }
          if (data.mantras && Array.isArray(data.mantras)) {
            this.ctx.saveMantras(data.mantras);
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

  public async syncLocalToCloud(): Promise<{ count: number }> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (!client || !user) return { count: 0 };

    let count = 0;

    // Sincroniza projetos
    const localProjects = this.ctx.projectsService.getLocalProjects();
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
    const localSubtasks = this.ctx.projectsService.getLocalSubtasks();
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
    const localSessions = this.ctx.getLocalSessions();
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
    const localEvents = this.ctx.calendarService.getLocalCalendarEvents();
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

    // Sincroniza anotações rápidas (quick_notes)
    if (this.ctx.getQuickNotes) {
      const localNotes = this.ctx.getQuickNotes();
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
        count++;
      }
    }

    return { count };
  }
}
