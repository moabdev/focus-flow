import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Sun,
  Clock,
  Calendar,
  Folder,
  Users,
  Trophy,
  BarChart3,
  Settings,
} from 'lucide-react';
import { AppViewMode, Project, StudyGroup } from '../../types';

export interface CommandItem {
  id: string;
  category: 'Ações Rápidas' | 'Navegação' | 'Projetos' | 'Grupos';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export interface BuildCommandsParams {
  isTimerRunning: boolean;
  projects: Project[];
  groups: StudyGroup[];
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
  onOpenZenMode: () => void;
  onOpenSettings: (tab?: any) => void;
  onOpenStats: () => void;
  onToggleTheme: () => void;
  onNavigate: (view: AppViewMode) => void;
  onOpenProjectDetail: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onClose: () => void;
}

export function buildCommandPaletteItems({
  isTimerRunning,
  projects,
  groups,
  onToggleTimer,
  onResetTimer,
  onSkipTimer,
  onOpenZenMode,
  onOpenSettings,
  onOpenStats,
  onToggleTheme,
  onNavigate,
  onOpenProjectDetail,
  onOpenGroup,
  onClose,
}: BuildCommandsParams): CommandItem[] {
  const list: CommandItem[] = [
    // Ações Rápidas
    {
      id: 'cmd-timer-toggle',
      category: 'Ações Rápidas',
      title: isTimerRunning ? 'Pausar Cronômetro de Foco' : 'Iniciar Ciclo de Foco',
      subtitle: 'Timer Pomodoro',
      icon: isTimerRunning ? <Pause size={16} /> : <Play size={16} />,
      shortcut: 'Espaço',
      action: () => {
        onToggleTimer();
        onClose();
      },
    },
    {
      id: 'cmd-timer-skip',
      category: 'Ações Rápidas',
      title: 'Pular para Próximo Ciclo / Pausa',
      icon: <SkipForward size={16} />,
      shortcut: 'Shift+S',
      action: () => {
        onSkipTimer();
        onClose();
      },
    },
    {
      id: 'cmd-timer-reset',
      category: 'Ações Rápidas',
      title: 'Reiniciar Timer do Ciclo Atual',
      icon: <RotateCcw size={16} />,
      action: () => {
        onResetTimer();
        onClose();
      },
    },
    {
      id: 'cmd-zen-mode',
      category: 'Ações Rápidas',
      title: 'Ativar Modo Zen (Tela Cheia Imersiva)',
      icon: <Maximize2 size={16} />,
      shortcut: 'Z',
      action: () => {
        onOpenZenMode();
        onClose();
      },
    },
    {
      id: 'cmd-theme-toggle',
      category: 'Ações Rápidas',
      title: 'Alternar Tema Claro / Escuro',
      icon: <Sun size={16} />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },

    // Navegação
    {
      id: 'cmd-nav-timer',
      category: 'Navegação',
      title: 'Ir para Foco & Timer Principal',
      icon: <Clock size={16} />,
      shortcut: '1',
      action: () => {
        onNavigate('timer');
        onClose();
      },
    },
    {
      id: 'cmd-nav-projects',
      category: 'Navegação',
      title: 'Ir para Projetos & Subtarefas',
      icon: <Folder size={16} />,
      shortcut: '2',
      action: () => {
        onNavigate('projects');
        onClose();
      },
    },
    {
      id: 'cmd-nav-calendar',
      category: 'Navegação',
      title: 'Ir para Calendário & Time-Blocking',
      icon: <Calendar size={16} />,
      shortcut: '3',
      action: () => {
        onNavigate('calendar');
        onClose();
      },
    },
    {
      id: 'cmd-nav-groups',
      category: 'Navegação',
      title: 'Ir para Grupos de Estudo & Chat',
      icon: <Users size={16} />,
      shortcut: '4',
      action: () => {
        onNavigate('groups');
        onClose();
      },
    },
    {
      id: 'cmd-nav-ranking',
      category: 'Navegação',
      title: 'Ir para Ranking Semanal',
      icon: <Trophy size={16} />,
      shortcut: '5',
      action: () => {
        onNavigate('ranking');
        onClose();
      },
    },
    {
      id: 'cmd-open-stats',
      category: 'Navegação',
      title: 'Abrir Estatísticas & Métricas',
      icon: <BarChart3 size={16} />,
      action: () => {
        onOpenStats();
        onClose();
      },
    },
    {
      id: 'cmd-open-settings',
      category: 'Navegação',
      title: 'Abrir Configurações do Sistema',
      icon: <Settings size={16} />,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
  ];

  // Projetos cadastrados
  projects.forEach((proj) => {
    list.push({
      id: `cmd-proj-${proj.id}`,
      category: 'Projetos',
      title: `Projeto: ${proj.title}`,
      subtitle: proj.description || 'Abrir página individual',
      icon: <span style={{ fontSize: '1rem' }}>{proj.icon || '📁'}</span>,
      action: () => {
        onOpenProjectDetail(proj.id);
        onClose();
      },
    });
  });

  // Grupos cadastrados
  groups.forEach((grp) => {
    list.push({
      id: `cmd-grp-${grp.id}`,
      category: 'Grupos',
      title: `Grupo: ${grp.name}`,
      subtitle: `${grp.category} • ${grp.code}`,
      icon: <span style={{ fontSize: '1rem' }}>{grp.avatar_icon || '👥'}</span>,
      action: () => {
        onNavigate('groups');
        onOpenGroup(grp.id);
        onClose();
      },
    });
  });

  return list;
}
