import { useCallback } from 'react';
import { Project } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';

interface UseProjectsActionsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  selectedProjectId: string;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string>>;
}

export function useProjectsActions({
  projects,
  setProjects,
  selectedProjectId,
  setSelectedProjectId,
}: UseProjectsActionsProps) {
  const createProject = useCallback(
    async (data: {
      title: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      color?: string;
      icon?: string;
    }) => {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        color: data.color || '#ff2a5f',
        icon: data.icon || '📁',
        total_elapsed_seconds: 0,
        created_at: new Date().toISOString(),
      };
      const updated = [newProject, ...projects];
      setProjects(updated);
      await storageService.saveProject(newProject);
      return newProject;
    },
    [projects, setProjects]
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) return;
      const updatedProject = { ...projects[index], ...updates };
      const updatedList = [...projects];
      updatedList[index] = updatedProject;
      setProjects(updatedList);
      await storageService.saveProject(updatedProject);
    },
    [projects, setProjects]
  );

  return {
    createProject,
    updateProject,
  };
}
