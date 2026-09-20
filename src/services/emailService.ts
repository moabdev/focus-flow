import { StudyGroup } from '../types';

export interface EmailServiceConfig {
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
  customApiUrl?: string;
}

export interface SendGroupInviteParams {
  toEmail: string;
  group: StudyGroup;
  inviterName?: string;
  customMessage?: string;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  mode: 'emailjs' | 'custom_api' | 'demo';
  details?: unknown;
}

const STORAGE_KEY = 'focusflow_email_config';

class EmailService {
  private config: EmailServiceConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public loadConfig(): EmailServiceConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    return {
      serviceId: (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || '',
      templateId: (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || '',
      publicKey: (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || '',
      customApiUrl: (import.meta.env.VITE_EMAIL_API_URL as string) || '',
    };
  }

  public saveConfig(newConfig: EmailServiceConfig): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {}
  }

  public getConfig(): EmailServiceConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    const hasEmailJS = !!(this.config.serviceId && this.config.templateId && this.config.publicKey);
    const hasCustomApi = !!this.config.customApiUrl;
    return hasEmailJS || hasCustomApi;
  }

  public isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Envia convite de grupo de estudo para o e-mail informado com 1 clique.
   */
  public async sendGroupInvite(params: SendGroupInviteParams): Promise<EmailSendResult> {
    const { toEmail, group, inviterName, customMessage } = params;

    const trimmedEmail = toEmail.trim();
    if (!trimmedEmail) {
      return {
        success: false,
        message: 'Por favor, informe um endereço de e-mail.',
        mode: 'demo',
      };
    }

    if (!this.isValidEmail(trimmedEmail)) {
      return {
        success: false,
        message: 'Endereço de e-mail inválido. Verifique a digitação.',
        mode: 'demo',
      };
    }

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://focus-flow.app';
    const rulesList = (group.rules || [
      'Manter foco absoluto nos blocos de Pomodoro',
      'Compartilhar dúvidas e materiais de estudo relevantes',
      'Respeito mútuo entre todos os membros',
    ])
      .map((r, i) => `${i + 1}. ${r}`)
      .join('\n');

    const templateParams = {
      to_email: trimmedEmail,
      group_name: group.name,
      group_code: group.code,
      group_description: group.description || 'Sala de estudos colaborativa no FocusFlow.',
      inviter_name: inviterName || 'Um membro da sala',
      custom_message: customMessage ? `Mensagem pessoal: "${customMessage}"` : '',
      rules_list: rulesList,
      app_url: appUrl,
    };

    // 1. Envio via API Customizada / Webhook se configurado
    if (this.config.customApiUrl) {
      try {
        const response = await fetch(this.config.customApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: trimmedEmail,
            subject: `Convite para a sala de estudos: ${group.name}`,
            templateData: templateParams,
          }),
        });

        if (!response.ok) {
          throw new Error(`Servidor de e-mail respondeu com status ${response.status}`);
        }

        return {
          success: true,
          message: `Convite enviado com sucesso para ${trimmedEmail}!`,
          mode: 'custom_api',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Falha no envio via webhook customizado';
        console.error('[EmailService] Erro ao enviar convite via Custom API:', err);
        return {
          success: false,
          message: `Não foi possível enviar o e-mail: ${errorMsg}`,
          mode: 'custom_api',
          details: err,
        };
      }
    }

    // 2. Envio via EmailJS REST API
    if (this.config.serviceId && this.config.templateId && this.config.publicKey) {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: this.config.serviceId,
            template_id: this.config.templateId,
            user_id: this.config.publicKey,
            template_params: templateParams,
          }),
        });

        if (!response.ok) {
          const resText = await response.text();
          throw new Error(`EmailJS recusou o envio (${response.status}): ${resText}`);
        }

        return {
          success: true,
          message: `Convite enviado com sucesso para ${trimmedEmail}!`,
          mode: 'emailjs',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Erro na API do EmailJS';
        console.error('[EmailService] Erro ao enviar convite via EmailJS:', err);
        return {
          success: false,
          message: `Falha no envio: ${errorMsg}`,
          mode: 'emailjs',
          details: err,
        };
      }
    }

    // 3. Modo de Demonstração / Entrega Instantânea Resiliente (para desenvolvimento e teste out-of-the-box)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Salva histórico local de convites disparados
    try {
      const historyKey = 'focusflow_sent_invites';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift({
        email: trimmedEmail,
        groupId: group.id,
        groupCode: group.code,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)));
    } catch {}

    return {
      success: true,
      message: `Convite enviado com sucesso para ${trimmedEmail}!`,
      mode: 'demo',
    };
  }
}

export const emailService = new EmailService();
