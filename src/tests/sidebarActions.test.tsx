import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/Sidebar';
import { Project } from '../types';

describe('Sidebar Component & Modos Expandido e Colapsado', () => {
  const mockProjects: Project[] = [
    {
      id: 'p-1',
      title: 'Projeto Alfa',
      description: 'Primeiro projeto de teste',
      color: '#ff2a5f',
      total_elapsed_seconds: 0,
      created_at: '2026-09-20',
    },
    {
      id: 'p-2',
      title: 'Projeto Beta',
      description: 'Segundo projeto de teste',
      color: '#10b981',
      total_elapsed_seconds: 0,
      created_at: '2026-09-20',
    },
  ];

  const defaultProps = {
    currentView: 'timer' as const,
    onChangeView: vi.fn(),
    streakDays: 5,
    projects: mockProjects,
    selectedProjectId: 'todos',
    onSelectProject: vi.fn(),
    onOpenProjectDetail: vi.fn(),
    onCreateProject: vi.fn(),
    colorMode: 'dark' as const,
    onToggleColorMode: vi.fn(),
    ambientSound: 'none' as const,
    ambientVolume: 0.5,
    onSelectAmbient: vi.fn(),
    onSetAmbientVolume: vi.fn(),
    userProfile: null,
    onGoogleLogin: vi.fn(),
    onSignOut: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenStats: vi.fn(),
    onToggleScratchpad: vi.fn(),
    onEnterZenMode: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    isMobileOpen: false,
    onCloseMobile: vi.fn(),
  };

  it('deve renderizar a sidebar expandida com título da marca e textos de navegação', () => {
    render(<Sidebar {...defaultProps} isCollapsed={false} />);

    expect(screen.getByText('FocusFlow')).toBeInTheDocument();
    expect(screen.getByText('Foco')).toBeInTheDocument();
    expect(screen.getByText('Projetos')).toBeInTheDocument();
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(screen.getByText('Grupos')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
    expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    expect(screen.getByText('Rascunhos')).toBeInTheDocument();

    // Streak textual
    expect(screen.getByText(/5 Dias/i)).toBeInTheDocument();
    expect(screen.getByText(/Ofensiva ativa/i)).toBeInTheDocument();

    // Botão de recolher com aria-label correspondente
    const collapseBtn = screen.getByRole('button', { name: /Recolher barra lateral/i });
    expect(collapseBtn).toBeInTheDocument();
  });

  it('deve disparar onChangeView com "drafts" ao clicar no botão Rascunhos', () => {
    const onChangeView = vi.fn();
    render(<Sidebar {...defaultProps} isCollapsed={false} onChangeView={onChangeView} />);

    const draftsBtn = screen.getByText('Rascunhos').closest('button')!;
    fireEvent.click(draftsBtn);
    expect(onChangeView).toHaveBeenCalledWith('drafts');
  });

  it('deve alternar a sidebar ao clicar no botão de recolher', () => {
    const onToggleCollapse = vi.fn();
    render(<Sidebar {...defaultProps} isCollapsed={false} onToggleCollapse={onToggleCollapse} />);

    const collapseBtn = screen.getByRole('button', { name: /Recolher barra lateral/i });
    fireEvent.click(collapseBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a sidebar colapsada com tooltips e badges compactos sem quebrar o layout', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);

    // Título da marca escondido em modo colapsado
    expect(screen.queryByText('FocusFlow')).not.toBeInTheDocument();

    // Textos de navegação escondidos
    expect(screen.queryByText('Foco')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendário')).not.toBeInTheDocument();

    // Botão de expansão com aria-label e título adequados
    const expandBtn = screen.getByRole('button', { name: /Expandir barra lateral/i });
    expect(expandBtn).toBeInTheDocument();

    // Badge compacto de ofensiva presente
    expect(screen.getByText('5')).toHaveClass('collapsed-streak-pill');

    // Badge compacto com contagem de projetos
    expect(screen.getByText('2')).toHaveClass('collapsed-mini-badge');

    // Botões de navegação possuem data-tooltip configurados
    const focusBtn = screen.getByTitle('Cronômetro Pomodoro & Foco');
    expect(focusBtn).toHaveAttribute('data-tooltip', 'Foco');

    const projBtn = screen.getByTitle('Projetos e Subtarefas');
    expect(projBtn).toHaveAttribute('data-tooltip', 'Projetos');
  });

  it('deve disparar onChangeView ao clicar em itens na sidebar colapsada', () => {
    const onChangeView = vi.fn();
    render(<Sidebar {...defaultProps} isCollapsed={true} onChangeView={onChangeView} />);

    const calendarBtn = screen.getByTitle('Calendário e Time-Blocking');
    fireEvent.click(calendarBtn);
    expect(onChangeView).toHaveBeenCalledWith('calendar');

    const groupsBtn = screen.getByTitle('Grupos de Estudo e Chat');
    fireEvent.click(groupsBtn);
    expect(onChangeView).toHaveBeenCalledWith('groups');
  });

  it('deve disparar onOpenStats ao clicar no badge de ofensiva colapsado', () => {
    const onOpenStats = vi.fn();
    render(<Sidebar {...defaultProps} isCollapsed={true} onOpenStats={onOpenStats} />);

    const streakBtn = screen.getByTitle(/5 dias de ofensiva de estudos/i);
    fireEvent.click(streakBtn);
    expect(onOpenStats).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar os botões de ferramentas rápidas no rodapé', () => {
    const onToggleColorMode = vi.fn();
    const onEnterZenMode = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        isCollapsed={true}
        onToggleColorMode={onToggleColorMode}
        onEnterZenMode={onEnterZenMode}
        onOpenSettings={onOpenSettings}
      />
    );

    const themeBtn = screen.getByRole('button', { name: /Alternar tema de cores/i });
    fireEvent.click(themeBtn);
    expect(onToggleColorMode).toHaveBeenCalledTimes(1);

    const zenBtn = screen.getByRole('button', { name: /Modo Zen/i });
    fireEvent.click(zenBtn);
    expect(onEnterZenMode).toHaveBeenCalledTimes(1);

    const settingsBtn = screen.getByRole('button', { name: /Configurações/i });
    fireEvent.click(settingsBtn);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
