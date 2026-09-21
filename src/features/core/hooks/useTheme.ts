import { useState, useEffect } from 'react';
import { ColorMode, ThemePalette } from '@/features/core/types';
import { storageService } from '@/features/core/api/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePalette>(() => storageService.getSettings().theme);
  const [colorMode, setColorModeState] = useState<ColorMode>(() => storageService.getSettings().color_mode);
  const [darkModeRunning, setDarkModeRunning] = useState<boolean>(() => storageService.getSettings().dark_mode_running);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Determina se o modo efetivo deve ser escuro ou claro
    let effectiveMode: 'dark' | 'light' = 'dark';
    if (colorMode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveMode = prefersDark ? 'dark' : 'light';
    } else {
      effectiveMode = colorMode;
    }

    // Se a opção de escurecer em execução estiver ativa e o timer estiver rodando, força dark
    if (darkModeRunning && isTimerRunning) {
      effectiveMode = 'dark';
    }

    root.setAttribute('data-color-mode', effectiveMode);
  }, [theme, colorMode, darkModeRunning, isTimerRunning]);

  const setTheme = (newTheme: ThemePalette) => {
    setThemeState(newTheme);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, theme: newTheme });
  };

  const setColorMode = (newMode: ColorMode) => {
    setColorModeState(newMode);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, color_mode: newMode });
  };

  const toggleColorMode = () => {
    const next = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(next);
  };

  const toggleDarkModeRunning = () => {
    const next = !darkModeRunning;
    setDarkModeRunning(next);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, dark_mode_running: next });
  };

  return {
    theme,
    setTheme,
    colorMode,
    setColorMode,
    toggleColorMode,
    darkModeRunning,
    toggleDarkModeRunning,
    setIsTimerRunning,
  };
}
