import { Project, Subtask, Task } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { STORAGE_KEYS } from '@/features/core/api/storageDefaults';
import { storageSubtasks } from './storageSubtasks';
import { storageProjectMetrics } from './storageProjectMetrics';

export class StorageProjectsService {
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

        if (!error && data) {
          if (data.length > 0) {
            this.saveLocalProjects(data as Project[]);
            return data as Project[];
          } else if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
            this.saveLocalProjects([]);
            return [];
          }
        }
      } catch (err) {
        console.warn('[FocusFlow] Erro ao sincronizar projetos do Supabase:', err);
      }
    }

    return this.getLocalProjects();
  }

  public async saveProject(project: Project): Promise<Project> {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
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
    storageSubtasks.saveLocalSubtasks(subtasks);

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    const client = supabaseService.getClient();
    const user = await supabaseService.getUser();

    if (client && user) {
      try {
        await client.from('subtasks').delete().eq('project_id', projectId);
        await client.from('projects').delete().eq('id', projectId);
      } catch (err) {
        console.warn('[FocusFlow] Erro ao deletar projeto no Supabase:', err);
      }
    }
  }

  // =========================================================================
  // 2. SUBTASKS (Delegated to storageSubtasks)
  // =========================================================================
  public getLocalSubtasks(): Subtask[] {
    return storageSubtasks.getLocalSubtasks();
  }

  public saveLocalSubtasks(subtasks: Subtask[]): void {
    storageSubtasks.saveLocalSubtasks(subtasks);
  }

  public async fetchSubtasks(): Promise<Subtask[]> {
    return storageSubtasks.fetchSubtasks();
  }

  public async saveSubtask(subtask: Subtask): Promise<Subtask> {
    return storageSubtasks.saveSubtask(subtask);
  }

  public async deleteSubtask(subtaskId: string): Promise<void> {
    return storageSubtasks.deleteSubtask(subtaskId);
  }

  // =========================================================================
  // 3. METRICS & TIME (Delegated to storageProjectMetrics)
  // =========================================================================
  public flushPendingRemoteSync(): void {
    storageProjectMetrics.flushPendingRemoteSync(this.saveProject.bind(this));
  }

  public async addTimeSpent(
    subtaskId: string,
    seconds: number
  ): Promise<{ subtask: Subtask | null; project: Project | null }> {
    return storageProjectMetrics.addTimeSpent(
      subtaskId,
      seconds,
      this.getLocalProjects.bind(this),
      this.saveLocalProjects.bind(this),
      this.saveProject.bind(this)
    );
  }

  // Delegados para compatibilidade legada
  public getLocalTasks(): Task[] {
    return storageSubtasks.getLocalTasks();
  }

  public saveLocalTasks(tasks: Task[]): void {
    storageSubtasks.saveLocalTasks(tasks);
  }

  public async fetchTasks(): Promise<Task[]> {
    return storageSubtasks.fetchTasks();
  }

  public async saveTask(task: Task): Promise<Task> {
    return storageSubtasks.saveTask(task);
  }

  public async deleteTask(taskId: string): Promise<void> {
    return storageSubtasks.deleteTask(taskId);
  }
}

export const storageProjectsService = new StorageProjectsService();
