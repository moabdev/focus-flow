import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppViewMode } from '@/features/core/types';

export function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive currentView from location pathname
  // e.g. "/projects/123" -> "projects"
  // "/stats" -> "stats"
  // "/" -> "timer"
  const getPathSegment = (path: string): AppViewMode => {
    const segment = path.split('/')[1] || 'timer';
    // Validate if segment is a valid AppViewMode, otherwise default to 'timer'
    const validViews = ['timer', 'projects', 'project-detail', 'calendar', 'stats', 'drafts', 'knowledge', 'flashcards', 'groups', 'settings', 'zen'];
    return validViews.includes(segment) ? (segment as AppViewMode) : 'timer';
  };

  const currentView = getPathSegment(location.pathname);

  const setCurrentView = useCallback((view: AppViewMode) => {
    navigate(`/${view === 'project-detail' ? 'projects' : view}`);
  }, [navigate]);

  const [selectedProjectDetailId, setSelectedProjectDetailId] = useState<string | null>(null);

  // Parse project id from URL if on project-detail
  useEffect(() => {
    if (location.pathname.startsWith('/projects/')) {
      const id = location.pathname.split('/')[2];
      if (id) setSelectedProjectDetailId(id);
    }
  }, [location.pathname]);

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
    navigate(`/projects/${id}`);
  }, [navigate]);

  const handleBackFromProjectDetail = useCallback(() => {
    setSelectedProjectDetailId(null);
    navigate('/projects');
  }, [navigate]);

  const handleOpenSettings = useCallback((tab: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup' = 'timer', playClick?: () => void) => {
    playClick?.();
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);
  
  const resetNavigation = useCallback(() => {
    setIsSettingsOpen(false);
    setIsScratchpadOpen(false);
    setIsZenModeOpen(false);
    setIsCommandPaletteOpen(false);
    setSelectedProjectDetailId(null);
    navigate('/timer');
  }, [navigate]);

  return {
    currentView, setCurrentView,
    selectedProjectDetailId, setSelectedProjectDetailId,
    isSidebarCollapsed, handleToggleSidebarCollapse,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isSettingsOpen, setIsSettingsOpen,
    settingsTab, setSettingsTab,
    isScratchpadOpen, setIsScratchpadOpen,
    isZenModeOpen, setIsZenModeOpen,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    handleOpenProjectDetail,
    handleBackFromProjectDetail,
    handleOpenSettings,
    resetNavigation
  };
}
