import { Project, Subtask, Task } from '../types';
import { supabaseService } from './supabase';
import { STORAGE_KEYS } from './storageDefaults';

export class StorageProjectsService {
  // =========================================================================
  // 1. PROJETOS
  // =========================================================================
  public getLocalProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveLocalProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public async fetchProjects(): Promise<Project[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          this.saveLocalProjects(data as Project[]);
          return data as Project[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar projetos do Supabase:', err);
      }
    }

    return this.getLocalProjects();
  }

  public async saveProject(project: Project): Promise<Project> {
    const projects = this.getLocalProjects();
    const index = projects.findIndex((p) => p.id === project.id);

    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    this.saveLocalProjects(projects);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('projects').upsert({
          id: project.id,
          user_id: user.id,
          title: project.title,
          description: project.description || '',
          start_date: project.start_date || null,
          end_date: project.end_date || null,
          color: project.color,
          icon: project.icon || '📁',
          total_elapsed_seconds: project.total_elapsed_seconds || 0,
        });
      } catch (err) {
        console.warn('[FocusFlow] Erro ao salvar projeto no Supabase:', err);
      }
    }

    return project;
  }

  public async deleteProject(projectId: string): Promise<void> {
    const projects = this.getLocalProjects().filter((p) => p.id !== projectId);
    this.saveLocalProjects(projects);

    const subtasks = this.getLocalSubtasks().filter((s) => s.project_id !== projectId);
    this.saveLocalSubtasks(subtasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('projects').delete().eq('id', projectId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar projeto no Supabase:', err);
      }
    }
  }

  // =========================================================================
  // 2. SUBTASKS
  // =========================================================================
  public getLocalSubtasks(): Subtask[] {
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
            const defaultProjectId = this.getLocalProjects()[0]?.id || 'proj-1';
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
          // fallback
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  public saveLocalSubtasks(subtasks: Subtask[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify(subtasks));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(subtasks));
  }

  public async fetchSubtasks(): Promise<Subtask[]> {
    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from('subtasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          this.saveLocalSubtasks(data as Subtask[]);
          return data as Subtask[];
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar subtasks do Supabase:', err);
      }
    }

    return this.getLocalSubtasks();
  }

  public async saveSubtask(subtask: Subtask): Promise<Subtask> {
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
  }

  public async deleteSubtask(subtaskId: string): Promise<void> {
    const subtasks = this.getLocalSubtasks().filter((s) => s.id !== subtaskId);
    this.saveLocalSubtasks(subtasks);

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('subtasks').delete().eq('id', subtaskId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar subtask no Supabase:', err);
      }
    }
  }

  public async addTimeSpent(
    subtaskId: string,
    seconds: number
  ): Promise<{ subtask: Subtask | null; project: Project | null }> {
    if (seconds <= 0) return { subtask: null, project: null };

    const subtasks = this.getLocalSubtasks();
    const subIndex = subtasks.findIndex((s) => s.id === subtaskId);
    if (subIndex === -1) return { subtask: null, project: null };

    const targetSubtask = subtasks[subIndex];
    targetSubtask.elapsed_seconds = (targetSubtask.elapsed_seconds || 0) + seconds;
    this.saveLocalSubtasks(subtasks);

    let targetProject: Project | null = null;
    const projects = this.getLocalProjects();
    const projIndex = projects.findIndex((p) => p.id === targetSubtask.project_id);

    if (projIndex >= 0) {
      targetProject = projects[projIndex];
      targetProject.total_elapsed_seconds = (targetProject.total_elapsed_seconds || 0) + seconds;
      this.saveLocalProjects(projects);
      this.saveProject(targetProject).catch(() => {});
    }

    this.saveSubtask(targetSubtask).catch(() => {});

    return { subtask: targetSubtask, project: targetProject };
  }

  // Delegados para compatibilidade legada
  public getLocalTasks(): Task[] {
    return this.getLocalSubtasks();
  }

  public saveLocalTasks(tasks: Task[]): void {
    this.saveLocalSubtasks(tasks as Subtask[]);
  }

  public async fetchTasks(): Promise<Task[]> {
    return this.fetchSubtasks();
  }

  public async saveTask(task: Task): Promise<Task> {
    return this.saveSubtask(task as Subtask);
  }

  public async deleteTask(taskId: string): Promise<void> {
    return this.deleteSubtask(taskId);
  }
}

export const storageProjectsService = new StorageProjectsService();
