import { useState, useCallback } from 'react';
import type { AppViewMode } from '@/features/core/types';

export function useAppNavigation() {
  const [currentView, setCurrentView] = useState<AppViewMode>('timer');
  const [selectedProjectDetailId, setSelectedProjectDetailId] = useState<string | null>(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('focusflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'timer' | 'theme' | 'sounds' | 'cloud' | 'backup'>('timer');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('focusflow_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  const handleOpenProjectDetail = useCallback((id: string) => {
    setSelectedProjectDetailId(id);
    setCurrentView('project-detail');
  }, []);

  const handleBackFromProjectDetail = useCallback(() => {
    setSelectedProjectDetailId(null);
    setCurrentView('projects');
  }, []);

  const handleOpenSettings = useCallback((tab: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup' = 'timer', playClick?: () => void) => {
    playClick?.();
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);
  
  const resetNavigation = useCallback(() => {
    setIsSettingsOpen(false);
    setIsStatsOpen(false);
    setIsScratchpadOpen(false);
    setIsZenModeOpen(false);
    setIsCommandPaletteOpen(false);
    setSelectedProjectDetailId(null);
    setCurrentView('timer');
  }, []);

  return {
    currentView, setCurrentView,
    selectedProjectDetailId, setSelectedProjectDetailId,
    isSidebarCollapsed, handleToggleSidebarCollapse,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isSettingsOpen, setIsSettingsOpen,
    settingsTab, setSettingsTab,
    isStatsOpen, setIsStatsOpen,
    isScratchpadOpen, setIsScratchpadOpen,
    isZenModeOpen, setIsZenModeOpen,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    handleOpenProjectDetail,
    handleBackFromProjectDetail,
    handleOpenSettings,
    resetNavigation
  };
}
