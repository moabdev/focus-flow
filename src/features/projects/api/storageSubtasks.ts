import { Subtask, Task } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { STORAGE_KEYS } from '@/features/core/api/storageDefaults';

export const storageSubtasks = {
  getLocalSubtasks(): Subtask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBTASKS);
      if (data) {
        return JSON.parse(data);
      }
      const oldTasksData = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (oldTasksData) {
        try {
          const oldTasks: any[] = JSON.parse(oldTasksData);
          if (Array.isArray(oldTasks) && oldTasks.length > 0) {
            let defaultProjectId = 'proj-1';
            try {
              const pData = localStorage.getItem(STORAGE_KEYS.PROJECTS);
              if (pData) {
                const projs = JSON.parse(pData);
                if (projs[0]) defaultProjectId = projs[0].id;
              }
            } catch {}
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
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveLocalSubtasks(subtasks: Subtask[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(subtasks));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(subtasks));
  },

  async fetchSubtasks(): Promise<Subtask[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (client && user) {
      try {
        const { data, error } = await client
          .from('subtasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          if (data.length > 0) {
            this.saveLocalSubtasks(data as Subtask[]);
            return data as Subtask[];
          } else if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
            this.saveLocalSubtasks([]);
            return [];
          }
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar subtasks do Supabase:', err);
      }
    }
    return this.getLocalSubtasks();
  },

  async saveSubtask(subtask: Subtask): Promise<Subtask> {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
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
  },

  async deleteSubtask(subtaskId: string): Promise<void> {
    const subtasks = this.getLocalSubtasks().filter((s) => s.id !== subtaskId);
    this.saveLocalSubtasks(subtasks);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();
    if (client && user) {
      try {
        await client.from('subtasks').delete().eq('id', subtaskId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar subtask no Supabase:', err);
      }
    }
  },

  getLocalTasks(): Task[] {
    return this.getLocalSubtasks();
  },

  saveLocalTasks(tasks: Task[]): void {
    this.saveLocalSubtasks(tasks as Subtask[]);
  },

  async fetchTasks(): Promise<Task[]> {
    return this.fetchSubtasks();
  },

  async saveTask(task: Task): Promise<Task> {
    return this.saveSubtask(task as Subtask);
  },

  async deleteTask(taskId: string): Promise<void> {
    return this.deleteSubtask(taskId);
  }
};
