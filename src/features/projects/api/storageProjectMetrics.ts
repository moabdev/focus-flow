import { Subtask, Project } from '@/features/core/types';
import { storageSubtasks } from './storageSubtasks';

export const storageProjectMetrics = {
  remoteSyncTimeout: null as ReturnType<typeof setTimeout> | null,
  pendingSubtaskSync: null as Subtask | null,
  pendingProjectSync: null as Project | null,

  flushPendingRemoteSync(saveProject: (p: Project) => Promise<Project>): void {
    if (this.remoteSyncTimeout) {
      clearTimeout(this.remoteSyncTimeout);
      this.remoteSyncTimeout = null;
    }
    if (this.pendingSubtaskSync) {
      storageSubtasks.saveSubtask(this.pendingSubtaskSync).catch(() => {});
      this.pendingSubtaskSync = null;
    }
    if (this.pendingProjectSync) {
      saveProject(this.pendingProjectSync).catch(() => {});
      this.pendingProjectSync = null;
    }
  },

  async addTimeSpent(
    subtaskId: string,
    seconds: number,
    getLocalProjects: () => Project[],
    saveLocalProjects: (projects: Project[]) => void,
    saveProject: (p: Project) => Promise<Project>
  ): Promise<{ subtask: Subtask | null; project: Project | null }> {
    if (seconds <= 0) return { subtask: null, project: null };

    const subtasks = storageSubtasks.getLocalSubtasks();
    const subIndex = subtasks.findIndex((s) => s.id === subtaskId);
    if (subIndex === -1) return { subtask: null, project: null };

    const targetSubtask = subtasks[subIndex];
    targetSubtask.elapsed_seconds = (targetSubtask.elapsed_seconds || 0) + seconds;
    storageSubtasks.saveLocalSubtasks(subtasks);

    let targetProject: Project | null = null;
    const projects = getLocalProjects();
    const projIndex = projects.findIndex((p) => p.id === targetSubtask.project_id);

    if (projIndex >= 0) {
      targetProject = projects[projIndex];
      targetProject.total_elapsed_seconds = (targetProject.total_elapsed_seconds || 0) + seconds;
      saveLocalProjects(projects);
    }

    this.pendingSubtaskSync = targetSubtask;
    if (targetProject) {
      this.pendingProjectSync = targetProject;
    }

    if (this.remoteSyncTimeout) clearTimeout(this.remoteSyncTimeout);
    this.remoteSyncTimeout = setTimeout(() => {
      this.flushPendingRemoteSync(saveProject);
    }, 2000);

    return { subtask: targetSubtask, project: targetProject };
  }
};
