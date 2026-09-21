import { describe, it, expect, vi } from 'vitest';
import { buildCommandPaletteItems } from '@/features/core/components/common/commandPaletteActions';
import { Project, StudyGroup } from '@/features/core/types';

describe('CommandPalette (Ações Globais e Busca Rápida)', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Projeto IA Avançada',
      description: 'Estudo de redes neurais e deep learning',
      color: '#ff2a5f',
      icon: '🧠',
      total_elapsed_seconds: 3600,
      created_at: new Date().toISOString(),
    },
  ];

  const mockGroups: StudyGroup[] = [
    {
      id: 'grp-1',
      name: 'Grupo Frontend',
      description: 'React, Vite, CSS',
      category: 'Tecnologia',
      avatar_icon: '💻',
      code: 'FRONT-1',
      member_count: 5,
      created_at: new Date().toISOString(),
    },
  ];

  it('deve gerar itens de ações rápidas, navegação, projetos e grupos', () => {
    const onToggleTimer = vi.fn();
    const onResetTimer = vi.fn();
    const onSkipTimer = vi.fn();
    const onOpenZenMode = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenStats = vi.fn();
    const onToggleTheme = vi.fn();
    const onNavigate = vi.fn();
    const onOpenProjectDetail = vi.fn();
    const onOpenGroup = vi.fn();
    const onClose = vi.fn();

    const items = buildCommandPaletteItems({
      isTimerRunning: false,
      projects: mockProjects,
      groups: mockGroups,
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
    });

    // Deve conter comandos essenciais
    expect(items.some((i) => i.id === 'cmd-timer-toggle')).toBe(true);
    expect(items.some((i) => i.id === 'cmd-zen-mode')).toBe(true);
    expect(items.some((i) => i.id === 'cmd-theme-toggle')).toBe(true);
    expect(items.some((i) => i.id === 'cmd-nav-calendar')).toBe(true);
    expect(items.some((i) => i.id === 'cmd-proj-proj-1')).toBe(true);
    expect(items.some((i) => i.id === 'cmd-grp-grp-1')).toBe(true);
  });

  it('deve disparar ação e fechar a paleta ao selecionar item', () => {
    const onToggleTimer = vi.fn();
    const onClose = vi.fn();

    const items = buildCommandPaletteItems({
      isTimerRunning: false,
      projects: [],
      groups: [],
      onToggleTimer,
      onResetTimer: vi.fn(),
      onSkipTimer: vi.fn(),
      onOpenZenMode: vi.fn(),
      onOpenSettings: vi.fn(),
      onOpenStats: vi.fn(),
      onToggleTheme: vi.fn(),
      onNavigate: vi.fn(),
      onOpenProjectDetail: vi.fn(),
      onOpenGroup: vi.fn(),
      onClose,
    });

    const toggleCmd = items.find((i) => i.id === 'cmd-timer-toggle');
    expect(toggleCmd).toBeDefined();
    toggleCmd?.action();

    expect(onToggleTimer).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve navegar para a visão correspondente', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    const items = buildCommandPaletteItems({
      isTimerRunning: false,
      projects: [],
      groups: [],
      onToggleTimer: vi.fn(),
      onResetTimer: vi.fn(),
      onSkipTimer: vi.fn(),
      onOpenZenMode: vi.fn(),
      onOpenSettings: vi.fn(),
      onOpenStats: vi.fn(),
      onToggleTheme: vi.fn(),
      onNavigate,
      onOpenProjectDetail: vi.fn(),
      onOpenGroup: vi.fn(),
      onClose,
    });

    const navCalendar = items.find((i) => i.id === 'cmd-nav-calendar');
    navCalendar?.action();

    expect(onNavigate).toHaveBeenCalledWith('calendar');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
