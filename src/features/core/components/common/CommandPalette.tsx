import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { AppViewMode, Project, StudyGroup } from '@/features/core/types';
import { buildCommandPaletteItems, CommandItem } from './commandPaletteActions';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppViewMode) => void;
  onOpenProjectDetail: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipTimer: () => void;
  onOpenZenMode: () => void;
  onOpenSettings: (tab?: any) => void;
  onOpenStats: () => void;
  onToggleTheme: () => void;
  projects: Project[];
  groups: StudyGroup[];
  isTimerRunning: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProjectDetail,
  onOpenGroup,
  onToggleTimer,
  onResetTimer,
  onSkipTimer,
  onOpenZenMode,
  onOpenSettings,
  onOpenStats,
  onToggleTheme,
  projects,
  groups,
  isTimerRunning,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const allCommands = useMemo<CommandItem[]>(() => {
    return buildCommandPaletteItems({
      isTimerRunning,
      projects,
      groups,
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
  }, [
    isTimerRunning,
    projects,
    groups,
    onToggleTimer,
    onSkipTimer,
    onResetTimer,
    onOpenZenMode,
    onToggleTheme,
    onNavigate,
    onOpenProjectDetail,
    onOpenGroup,
    onOpenStats,
    onOpenSettings,
    onClose,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length)
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="command-palette-modal glass-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Barra de Comandos"
      >
        <div className="command-palette-search-bar">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Digite um comando, projeto ou grupo... (Esc para sair)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="command-kbd-badge">ESC</span>
        </div>

        <div className="command-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">Nenhum comando ou projeto encontrado.</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  type="button"
                  key={cmd.id}
                  className={`command-palette-item ${isSelected ? 'active' : ''}`}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-item-icon">{cmd.icon}</div>
                  <div className="command-item-info">
                    <div className="command-item-title">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="command-item-subtitle">{cmd.subtitle}</div>
                    )}
                  </div>

                  <div className="command-item-meta">
                    <span className="command-item-category">{cmd.category}</span>
                    {cmd.shortcut && (
                      <span className="command-kbd-badge">{cmd.shortcut}</span>
                    )}
                    <ArrowRight size={14} className="command-item-arrow" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-footer-tip">
            <span>
              <kbd className="command-kbd-inline">↑</kbd>
              <kbd className="command-kbd-inline">↓</kbd> navegar
            </span>
            <span>
              <kbd className="command-kbd-inline">↵</kbd> selecionar
            </span>
            <span>
              <kbd className="command-kbd-inline">ESC</kbd> fechar
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>FocusFlow Pro</span>
        </div>
      </div>
    </div>
  );
};
