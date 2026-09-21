import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/features/core/api/supabase';
import { syncService } from '@/features/core/api/syncService';
import { storageService } from '@/features/core/api/storage';
import { badgeService } from '@/features/stats/api/badgeService';
import { storageGroupsService } from '@/features/groups/api/storageGroups';
import { useToast } from '@/features/core/contexts/ToastContext';
import type { SupabaseProfile, CloudSyncInfo } from '@/features/core/types';

interface AuthAndSyncProps {
  playClick: () => void;
  clearProjects: () => void;
  clearEvents: () => void;
  clearStats: () => void;
  clearMantras: () => void;
  resetNavigation: () => void;
  resetTimer: () => void;
}

export function useAppAuthAndSync({
  playClick,
  clearProjects,
  clearEvents,
  clearStats,
  clearMantras,
  resetNavigation,
  resetTimer
}: AuthAndSyncProps) {
  const [userProfile, setUserProfile] = useState<SupabaseProfile | null>(null);
  const [syncInfo, setSyncInfo] = useState<CloudSyncInfo>(() => syncService.getStatus());
  const toast = useToast();

  useEffect(() => {
    const unsubscribeAuth = supabaseService.onAuthChange((profile) => {
      setUserProfile(profile);
      syncService.init(profile);
    });
    const unsubscribeSync = syncService.subscribeStatus((info) => setSyncInfo(info));
    return () => {
      unsubscribeAuth();
      unsubscribeSync();
    };
  }, []);

  const handleGoogleLogin = async () => {
    playClick();
    const { error } = await supabaseService.signInWithGoogle();
    if (error) toast.error(`Erro ao iniciar login Google: ${error.message}`, 'Falha de Autenticação');
  };

  const handleSignOut = async () => {
    playClick();
    await supabaseService.signOut();
    syncService.init(null);

    // Limpar armazenamento do navegador (localStorage, sessionStorage, tokens de autenticação)
    storageService.clearAllUserData();
    badgeService.clearBadges();
    storageGroupsService.resetGroupsData();

    // Limpar estados da UI imediatamente
    clearProjects();
    clearEvents();
    clearStats();
    clearMantras();
    setUserProfile(null);
    
    resetNavigation();
    resetTimer();

    toast.info('Sessão encerrada e todos os dados pessoais foram excluídos do navegador.', 'Logout');
  };

  const handleManualSync = useCallback(async () => {
    const success = await syncService.syncAll();
    if (success) {
      toast.success('Sincronização com o Supabase concluída com sucesso!', 'Nuvem Atualizada');
    } else {
      toast.error('Não foi possível sincronizar no momento. Verifique a conexão.', 'Falha de Sincronização');
    }
  }, [toast]);

  return {
    userProfile,
    syncInfo,
    handleGoogleLogin,
    handleSignOut,
    handleManualSync
  };
}
