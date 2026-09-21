import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AmbientSound } from '@/features/core/types';

interface HeaderAmbientMenuProps {
  ambientSound: AmbientSound;
  ambientVolume: number;
  onSelectAmbient: (sound: AmbientSound) => void;
  onSetAmbientVolume: (vol: number) => void;
}

const getAmbientLabel = (sound: AmbientSound) => {
  switch (sound) {
    case 'rain': return '🌧️ Chuva';
    case 'brownNoise': return '🎧 Ruído Marrom';
    case 'whiteNoise': return '📻 Ruído Branco';
    default: return '🔇 Sem Som';
  }
};

export const HeaderAmbientMenu: React.FC<HeaderAmbientMenuProps> = ({
  ambientSound,
  ambientVolume,
  onSelectAmbient,
  onSetAmbientVolume,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Sons de Foco Ambiente"
        aria-label="Sons de Foco Ambiente"
      >
        {ambientSound === 'none' ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {isOpen && (
        <div className="glass-panel ambient-dropdown-menu">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            ÁUDIO AMBIENTE
          </div>
          {(['none', 'rain', 'brownNoise', 'whiteNoise'] as AmbientSound[]).map((snd) => (
            <button
              key={snd}
              style={{
                textAlign: 'left',
                padding: '0.45rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: ambientSound === snd ? 700 : 500,
                background: ambientSound === snd ? 'var(--accent-primary)' : 'transparent',
                color: ambientSound === snd ? '#fff' : 'var(--text-primary)',
              }}
              onClick={() => {
                onSelectAmbient(snd);
                setIsOpen(false);
              }}
            >
              {getAmbientLabel(snd)}
            </button>
          ))}

          {ambientSound !== 'none' && (
            <div
              style={{
                marginTop: '0.5rem',
                borderTop: '1px solid var(--border-glass-subtle)',
                paddingTop: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Volume: {Math.round(ambientVolume * 100)}%
              </div>
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
