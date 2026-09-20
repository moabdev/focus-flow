import React from 'react';
import { UserSettings, SupabaseProfile, Subtask, AmbientSound, StudyMetrics, Quote } from '../types';
import { Scratchpad } from './Scratchpad';
import { StatsModal } from './StatsModal';
import { SettingsModal } from './SettingsModal';
import { ZenMode } from './ZenMode';

interface AppModalsProps {
  isScratchpadOpen: boolean;
  onCloseScratchpad: () => void;
  isStatsOpen: boolean;
  onCloseStats: () => void;
  metrics: StudyMetrics;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onPlayAlarm: (sound: any) => void;
  userProfile: SupabaseProfile | null;
  settingsTab: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup';
  isZenModeOpen: boolean;
  onCloseZenMode: () => void;
  timer: {
    formattedTime: string;
    progressPercent: number;
    isRunning: boolean;
    toggle: () => void;
  };
  activeSubtask: Subtask | null;
  activeQuote: Quote;
  ambient: AmbientSound;
  onToggleAmbient: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isScratchpadOpen,
  onCloseScratchpad,
  isStatsOpen,
  onCloseStats,
  metrics,
  isSettingsOpen,
  onCloseSettings,
  settings,
  onUpdateSettings,
  onPlayAlarm,
  userProfile,
  settingsTab,
  isZenModeOpen,
  onCloseZenMode,
  timer,
  activeSubtask,
  activeQuote,
  ambient,
  onToggleAmbient,
}) => {
  return (
    <>
      {/* Gaveta Lateral de Anotações (Scratchpad) */}
      <Scratchpad isOpen={isScratchpadOpen} onClose={onCloseScratchpad} />

      {/* Modal de Estatísticas e Métricas */}
      <StatsModal isOpen={isStatsOpen} onClose={onCloseStats} metrics={metrics} />

      {/* Modal de Configurações Gerais */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onPlayAlarmPreview={onPlayAlarm}
        userProfile={userProfile}
        onRefreshTasks={() => window.location.reload()}
        initialTab={settingsTab}
      />

      {/* Modo Zen (Fullscreen) */}
      <ZenMode
        isOpen={isZenModeOpen}
        onExit={onCloseZenMode}
        formattedTime={timer.formattedTime}
        progressPercent={timer.progressPercent}
        isRunning={timer.isRunning}
        onToggleTimer={timer.toggle}
        activeTask={activeSubtask}
        quoteText={activeQuote.text}
        ambientSound={ambient}
        onToggleAmbient={onToggleAmbient}
      />
    </>
  );
};
