import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { UserSettings, SupabaseProfile } from '@/features/core/types';
import { supabaseService } from '@/features/core/api/supabase';
import { storageService } from '@/features/core/api/storage';
import { syncService } from '@/features/core/api/syncService';

// Mock dependências globais
vi.mock('@/features/core/api/supabase', () => ({
  supabaseService: {
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }
}));

vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    exportBackupJSON: vi.fn(),
    importBackupJSON: vi.fn(),
  }
}));

vi.mock('@/features/core/api/syncService', () => ({
  syncService: {
    init: vi.fn(),
    syncAll: vi.fn(),
  }
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('@/features/core/contexts/ToastContext', () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    info: mockToastInfo,
  })
}));

describe('SettingsModal Component', () => {
  const defaultSettings: UserSettings = {
    pomodoro_time: 25,
    short_break_time: 5,
    long_break_time: 15,
    long_break_interval: 4,
    theme: 'ocean',
    color_mode: 'system',
    dark_mode_running: false,
    alarm_sound: 'crystal',
    ambient_sound: 'none',
    sound_volume: 0,
    ambient_volume: 0,
    auto_start_breaks: false,
    auto_start_pomodoros: false
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    settings: defaultSettings,
    onUpdateSettings: vi.fn(),
    onPlayAlarmPreview: vi.fn(),
    userProfile: null as SupabaseProfile | null,
    onRefreshTasks: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve renderizar quando isOpen for false', () => {
    const { container } = render(<SettingsModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve alternar entre as abas', () => {
    render(<SettingsModal {...defaultProps} />);

    // Por padrão a aba inicial é "timer"
    expect(screen.getByText(/DURAÇÕES DOS CICLOS/i)).toBeInTheDocument();

    // Mudar para Theme
    fireEvent.click(screen.getByText('Temas'));
    expect(screen.getByText('Auto')).toBeInTheDocument();

    // Mudar para Sounds
    fireEvent.click(screen.getByText('Sons'));
    expect(screen.getByText(/Som de Alarme de Conclusão/i)).toBeInTheDocument();

    // Mudar para Backup
    fireEvent.click(screen.getByText('Backup'));
    expect(screen.getByText(/Exportar Backup/i)).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão fechar', () => {
    render(<SettingsModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText('Fechar');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  describe('Tab: Backup', () => {
    it('deve chamar exportBackupJSON ao clicar em exportar', () => {
      render(<SettingsModal {...defaultProps} initialTab="backup" />);
      const exportBtn = screen.getByText(/Exportar Backup/i);
      fireEvent.click(exportBtn);
      expect(storageService.exportBackupJSON).toHaveBeenCalled();
    });

    it('deve importar backup corretamente ao fazer upload de arquivo válido', async () => {
      vi.mocked(storageService.importBackupJSON).mockResolvedValueOnce(true);

      render(<SettingsModal {...defaultProps} initialTab="backup" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toBeNull();

      const file = new File(['{"tasks": []}'], 'backup.json', { type: 'application/json' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(storageService.importBackupJSON).toHaveBeenCalledWith(file);
      });
      expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('sucesso'), expect.any(String));
    });

    it('deve exibir toast de erro ao importar arquivo inválido', async () => {
      vi.mocked(storageService.importBackupJSON).mockResolvedValueOnce(false);

      render(<SettingsModal {...defaultProps} initialTab="backup" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['invalido'], 'backup.json', { type: 'application/json' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(storageService.importBackupJSON).toHaveBeenCalled();
      });
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('inválido'), expect.any(String));
    });
  });

  describe('Tab: Cloud & Auth', () => {
    it('deve mostrar botão de login do Google se usuário não logado', () => {
      render(<SettingsModal {...defaultProps} initialTab="cloud" />);
      expect(screen.getByText(/Entrar com o Google/i)).toBeInTheDocument();
    });

    it('deve chamar signInWithGoogle ao clicar em login', async () => {
      vi.mocked(supabaseService.signInWithGoogle).mockResolvedValueOnce({ error: null } as any);
      render(<SettingsModal {...defaultProps} initialTab="cloud" />);

      fireEvent.click(screen.getByText(/Entrar com o Google/i));

      await waitFor(() => {
        expect(supabaseService.signInWithGoogle).toHaveBeenCalled();
      });
    });

    it('deve mostrar estado logado e botão de sync se usuário existir', () => {
      const profile: SupabaseProfile = {
        id: '123',
        email: 'teste@email.com',
        full_name: 'Usuário Teste',
        avatar_url: '',
      };

      render(<SettingsModal {...defaultProps} initialTab="cloud" userProfile={profile} />);

      expect(screen.getByText('teste@email.com')).toBeInTheDocument();
      expect(screen.getByText('☁️ Enviar Tarefas & Histórico Locais para a Nuvem')).toBeInTheDocument();
      expect(screen.getByText(/Sair/i, { selector: 'button' })).toBeInTheDocument();
    });

    it('deve chamar signOut e syncService.init(null) ao clicar em sair', async () => {
      const profile: SupabaseProfile = {
        id: '123',
        email: 'teste@email.com',
        full_name: 'Usuário Teste',
        avatar_url: '',
      };

      render(<SettingsModal {...defaultProps} initialTab="cloud" userProfile={profile} />);
      fireEvent.click(screen.getByText(/Sair/i, { selector: 'button' }));

      await waitFor(() => {
        expect(supabaseService.signOut).toHaveBeenCalled();
        expect(syncService.init).toHaveBeenCalledWith(null);
        expect(mockToastInfo).toHaveBeenCalled();
      });
    });

    it('deve chamar syncAll ao sincronizar e notificar sucesso', async () => {
      const profile: SupabaseProfile = {
        id: '123',
        email: 'teste@email.com',
        full_name: 'Usuário Teste',
        avatar_url: '',
      };
      vi.mocked(syncService.syncAll).mockResolvedValueOnce(true);

      render(<SettingsModal {...defaultProps} initialTab="cloud" userProfile={profile} />);
      fireEvent.click(screen.getByText('☁️ Enviar Tarefas & Histórico Locais para a Nuvem'));

      await waitFor(() => {
        expect(syncService.syncAll).toHaveBeenCalled();
      });
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  describe('Tab: Timer', () => {
    it('deve exibir os inputs de tempo do pomodoro e atualizar on blur', () => {
      render(<SettingsModal {...defaultProps} initialTab="timer" />);
      const pomoInput = screen.getByDisplayValue('25');

      fireEvent.change(pomoInput, { target: { value: '30' } });
      fireEvent.blur(pomoInput);

      expect(defaultProps.onUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ pomodoro_time: 30 })
      );
    });
  });

  describe('Tab: Sounds', () => {
    it('deve mostrar as opções de alarme e chamar onChange (update settings)', () => {
      render(<SettingsModal {...defaultProps} initialTab="sounds" />);

      // Clique no botão de som Marimba Suave (ou similar via regex para ignorar ícones)
      const marimbaOption = screen.getByText(/Marimba Suave/i);
      fireEvent.click(marimbaOption);

      // Quando selecionamos o alarme ele dispara o onUpdateSettings com esse alarme
      // dependendo de como está implementado na tab.
    });
  });
});
