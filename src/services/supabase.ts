import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseProfile } from '../types';

// Chaves padrão opcionais via import.meta.env
const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl: string = '';
  private currentKey: string = '';

  constructor() {
    this.initFromSavedConfig();
  }

  private cleanUrl(url: string): string {
    return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  public initFromSavedConfig(): void {
    const rawUrl = localStorage.getItem('focusflow_supabase_url') || DEFAULT_URL;
    const savedKey = localStorage.getItem('focusflow_supabase_key') || DEFAULT_KEY;
    const savedUrl = this.cleanUrl(rawUrl);

    if (savedUrl && savedKey) {
      try {
        this.client = createClient(savedUrl, savedKey.trim());
        this.currentUrl = savedUrl;
        this.currentKey = savedKey.trim();
      } catch (err) {
        console.warn('[FocusFlow] Erro ao inicializar Supabase:', err);
        this.client = null;
      }
    }
  }

  public setConfig(url: string, key: string): boolean {
    try {
      const sanitizedUrl = this.cleanUrl(url);
      const sanitizedKey = key.trim();

      if (!sanitizedUrl || !sanitizedKey) {
        this.client = null;
        localStorage.removeItem('focusflow_supabase_url');
        localStorage.removeItem('focusflow_supabase_key');
        return true;
      }

      this.client = createClient(sanitizedUrl, sanitizedKey);
      this.currentUrl = sanitizedUrl;
      this.currentKey = sanitizedKey;
      localStorage.setItem('focusflow_supabase_url', this.currentUrl);
      localStorage.setItem('focusflow_supabase_key', this.currentKey);
      return true;
    } catch (err) {
      console.error('[FocusFlow] Configuração inválida do Supabase:', err);
      return false;
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('O Supabase ainda não foi configurado. Insira a URL e a Chave Anon nas configurações.') };
    }

    try {
      const { error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  }

  public async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  public async getUser(): Promise<User | null> {
    if (!this.client) return null;
    const { data } = await this.client.auth.getUser();
    return data?.user || null;
  }

  public onAuthChange(callback: (profile: SupabaseProfile | null) => void): () => void {
    if (!this.client) {
      callback(null);
      return () => {};
    }

    // Checa sessão atual
    this.client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        callback(this.mapUserToProfile(session.user));
      } else {
        callback(null);
      }
    });

    const { data: { subscription } } = this.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(this.mapUserToProfile(session.user));
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  }

  private mapUserToProfile(user: User): SupabaseProfile {
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    };
  }
}

export const supabaseService = new SupabaseService();
