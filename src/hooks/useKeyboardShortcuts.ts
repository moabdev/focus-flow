import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onToggleTimer: () => void;
  onSkipTimer: () => void;
  onResetTimer: () => void;
  onToggleZenMode: () => void;
  onCloseModals: () => void;
  playClick: () => void;
}

export function useKeyboardShortcuts({
  onToggleTimer,
  onSkipTimer,
  onResetTimer,
  onToggleZenMode,
  onCloseModals,
  playClick,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playClick();
        onToggleTimer();
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        playClick();
        onSkipTimer();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        playClick();
        onResetTimer();
      } else if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        playClick();
        onToggleZenMode();
      } else if (e.code === 'Escape') {
        onCloseModals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTimer, onSkipTimer, onResetTimer, onToggleZenMode, onCloseModals, playClick]);
}
