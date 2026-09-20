import React from 'react';
import { Sun, Moon, Maximize2, Settings } from 'lucide-react';
import { AmbientSound, ColorMode } from '../../types';
import { SidebarAmbientMenu } from './SidebarAmbientMenu';

interface SidebarQuickToolsProps {
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  ambientSound: AmbientSound;
  ambientVolume: number;
  onSelectAmbient: (snd: AmbientSound) => void;
  onSetAmbientVolume: (vol: number) => void;
  showAmbientMenu: boolean;
  onToggleAmbientMenu: () => void;
  onCloseAmbientMenu: () => void;
  onEnterZenMode: () => void;
  onOpenSettings: (tab?: 'timer' | 'theme' | 'sounds' | 'cloud' | 'backup') => void;
  onCloseMobile: () => void;
  isMobileOpen: boolean;
}

export const SidebarQuickTools: React.FC<SidebarQuickToolsProps> = ({
  colorMode,
  onToggleColorMode,
  ambientSound,
  ambientVolume,
  onSelectAmbient,
  onSetAmbientVolume,
  showAmbientMenu,
  onToggleAmbientMenu,
  onCloseAmbientMenu,
  onEnterZenMode,
  onOpenSettings,
  onCloseMobile,
  isMobileOpen,
}) => {
  return (
    <div className="sidebar-quick-tools">
      <SidebarAmbientMenu
        ambientSound={ambientSound}
        ambientVolume={ambientVolume}
        onSelectAmbient={onSelectAmbient}
        onSetAmbientVolume={onSetAmbientVolume}
        isOpen={showAmbientMenu}
        onToggleOpen={onToggleAmbientMenu}
        onClose={onCloseAmbientMenu}
      />

      <button
        className="icon-btn"
        onClick={onToggleColorMode}
        title={`Alternar para modo ${colorMode === 'dark' ? 'Claro' : 'Escuro'}`}
        aria-label="Alternar tema de cores"
      >
        {colorMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <button
        className="icon-btn"
        onClick={() => {
          onEnterZenMode();
          if (isMobileOpen) onCloseMobile();
        }}
        title="Modo Zen (Tela Cheia)"
        aria-label="Modo Zen"
      >
        <Maximize2 size={17} />
      </button>

      <button
        className="icon-btn"
        onClick={() => {
          onOpenSettings();
          if (isMobileOpen) onCloseMobile();
        }}
        title="Configurações"
        aria-label="Configurações"
      >
        <Settings size={17} />
      </button>
    </div>
  );
};
