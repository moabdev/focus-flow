import React from 'react';
import { Download } from 'lucide-react';
import { storageService } from '../../services/storage';

interface SettingsBackupTabProps {
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsBackupTab: React.FC<SettingsBackupTabProps> = ({ onFileImport }) => {
  return (
    <>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Exporte todo o seu histórico, tarefas, preferências e anotações para um arquivo JSON ou restaure um backup anterior.
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          className="main-start-btn"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
          onClick={() => storageService.exportBackupJSON()}
        >
          <Download size={18} /> Exportar Backup (JSON)
        </button>
      </div>

      <div
        style={{
          marginTop: '1rem',
          borderTop: '1px solid var(--border-glass-subtle)',
          paddingTop: '1rem',
        }}
      >
        <div className="setting-label" style={{ marginBottom: '0.5rem' }}>
          Restaurar de um Arquivo
        </div>
        <input
          type="file"
          accept=".json"
          onChange={onFileImport}
          style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
        />
      </div>
    </>
  );
};
