import React, { useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AmbientSound } from '../../types';

interface SidebarAmbientMenuProps {
  ambientSound: AmbientSound;
  ambientVolume: number;
  onSelectAmbient: (snd: AmbientSound) => void;
  onSetAmbientVolume: (vol: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
}

const getAmbientLabel = (sound: AmbientSound) => {
  switch (sound) {
    case 'rain': return '🌧️ Chuva';
    case 'brownNoise': return '🎧 Ruído Marrom';
    case 'whiteNoise': return '📻 Ruído Branco';
    default: return '🔇 Sem Som';
  }
};

export const SidebarAmbientMenu: React.FC<SidebarAmbientMenuProps> = ({
  ambientSound,
  ambientVolume,
  onSelectAmbient,
  onSetAmbientVolume,
  isOpen,
  onToggleOpen,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="sidebar-ambient-wrap" style={{ position: 'relative' }} ref={menuRef}>
      <button
        className={`icon-btn ${ambientSound !== 'none' ? 'active-audio' : ''}`}
        onClick={onToggleOpen}
        title="Sons de Foco Ambiente"
        aria-label="Sons de Foco Ambiente"
      >
        {ambientSound === 'none' ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>

      {isOpen && (
        <div className="glass-panel sidebar-ambient-popover">
          <div className="popover-title">ÁUDIO AMBIENTE</div>
          {(['none', 'rain', 'brownNoise', 'whiteNoise'] as AmbientSound[]).map((snd) => (
            <button
              key={snd}
              className={`ambient-opt-btn ${ambientSound === snd ? 'active' : ''}`}
              onClick={() => {
                onSelectAmbient(snd);
                onClose();
              }}
            >
              {getAmbientLabel(snd)}
            </button>
          ))}

          {ambientSound !== 'none' && (
            <div className="volume-slider-wrap">
              <div className="volume-label">Volume: {Math.round(ambientVolume * 100)}%</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => onSetAmbientVolume(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
