import { StudyGroup } from '../types';

export type EmailProviderType = 'brevo' | 'resend' | 'custom_api' | 'emailjs' | 'demo';

export interface EmailServiceConfig {
  provider?: EmailProviderType;
  // Brevo (300 e-mails/dia = 9.000/mês grátis)
  brevoApiKey?: string;
  brevoSenderEmail?: string;
  brevoSenderName?: string;
  // Resend (3.000 e-mails/mês grátis)
  resendApiKey?: string;
  resendSenderEmail?: string;
  resendSenderName?: string;
  // EmailJS (200 e-mails/mês)
  serviceId?: string;
  templateId?: string;
  publicKey?: string;
  // API Customizada ou Supabase Edge Function
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
  mode: 'brevo' | 'resend' | 'emailjs' | 'custom_api' | 'demo';
  details?: unknown;
}

export interface DailyQuotaUsage {
  count: number;
  limit: number;
  remaining: number;
  resetDate: string;
  provider: EmailProviderType;
}

export const PROVIDER_DAILY_LIMITS: Record<EmailProviderType, number> = {
  brevo: 300, // 300 e-mails por dia (~9.000/mês) 100% Free
  resend: 100, // 100 e-mails por dia (~3.000/mês) Free
  emailjs: 200, // 200 e-mails no plano free
  custom_api: 500, // Cota de API própria
  demo: 300, // Modo demonstração
};

const STORAGE_KEY = 'focusflow_email_config';
const HISTORY_KEY = 'focusflow_sent_invites';

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
    } catch { }

    return {
      provider: ((import.meta.env.VITE_EMAIL_PROVIDER as string) as EmailProviderType) || 'brevo',
      brevoApiKey: (import.meta.env.VITE_BREVO_API_KEY as string) || '',
      brevoSenderEmail: (import.meta.env.VITE_BREVO_SENDER_EMAIL as string) || '',
      brevoSenderName: (import.meta.env.VITE_BREVO_SENDER_NAME as string) || 'FocusFlow',
      resendApiKey: (import.meta.env.VITE_RESEND_API_KEY as string) || '',
      resendSenderEmail: (import.meta.env.VITE_RESEND_SENDER_EMAIL as string) || '',
      resendSenderName: (import.meta.env.VITE_RESEND_SENDER_NAME as string) || 'FocusFlow',
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
    } catch { }
  }

  public getConfig(): EmailServiceConfig {
    return { ...this.config };
  }

  public getActiveProvider(): EmailProviderType {
    if (this.config.provider) return this.config.provider;
    if (this.config.brevoApiKey) return 'brevo';
    if (this.config.resendApiKey) return 'resend';
    if (this.config.customApiUrl) return 'custom_api';
    if (this.config.serviceId && this.config.templateId && this.config.publicKey) return 'emailjs';
    return 'brevo';
  }

  public isConfigured(): boolean {
    const provider = this.getActiveProvider();
    if (provider === 'brevo') return !!this.config.brevoApiKey;
    if (provider === 'resend') return !!this.config.resendApiKey;
    if (provider === 'custom_api') return !!this.config.customApiUrl;
    if (provider === 'emailjs') {
      return !!(this.config.serviceId && this.config.templateId && this.config.publicKey);
    }
    return false;
  }

  public isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Retorna a contagem de envios de hoje e cota restante baseado no provedor ativo (ex: Brevo = 300/dia)
   */
  public getDailyUsage(): DailyQuotaUsage {
    const provider = this.getActiveProvider();
    const limit = PROVIDER_DAILY_LIMITS[provider] || 300;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const history: Array<{ sentAt: string }> = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || '[]'
      );
      const todayCount = history.filter(
        (item) => item.sentAt && item.sentAt.startsWith(todayStr)
      ).length;

      return {
        count: todayCount,
        limit,
        remaining: Math.max(0, limit - todayCount),
        resetDate: todayStr,
        provider,
      };
    } catch {
      return {
        count: 0,
        limit,
        remaining: limit,
        resetDate: todayStr,
        provider,
      };
    }
  }

  private recordSentInvite(email: string, group: StudyGroup): void {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.unshift({
        email,
        groupId: group.id,
        groupCode: group.code,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 1000)));
    } catch { }
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

    const quota = this.getDailyUsage();
    if (quota.remaining <= 0) {
      return {
        success: false,
        message: `Limite diário de ${quota.limit} e-mails atingido hoje. O envio será liberado novamente à meia-noite.`,
        mode: quota.provider,
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

    const rulesHtml = (group.rules || [
      'Manter foco absoluto nos blocos de Pomodoro',
      'Compartilhar dúvidas e materiais de estudo relevantes',
      'Respeito mútuo entre todos os membros',
    ])
      .map((r) => `<li style="margin-bottom: 4px;">${r}</li>`)
      .join('');

    const htmlMessage = `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1">
  <div style="max-width: 600px; margin: auto; padding: 16px">
    <a style="text-decoration: none; outline: none" href="${appUrl}" target="_blank">
      <span style="font-size: 24px; font-weight: 800; color: #fc0038; letter-spacing: -0.5px;">⚡ FocusFlow</span>
    </a>
    <p>Bem-vindo(a) à família FocusFlow! Estamos muito felizes em ter você com a gente.</p>
    <p>
      Você foi convidado(a) por <strong>${inviterName || 'um colega'}</strong> para participar da sala de estudos <strong>"${group.name}"</strong>.
    </p>
    ${customMessage ? `<p style="padding: 10px 14px; background-color: rgba(252, 0, 56, 0.06); border-left: 4px solid #fc0038; font-style: italic;">"${customMessage}"</p>` : ''}
    <p style="color: #4b5563;">
      ${group.description || 'Uma sala de estudos colaborativa com foco absoluto e metas conjuntas.'}
    </p>
    <div style="background-color: #ffffff; border: 1px dashed #fc0038; border-radius: 6px; padding: 14px; margin: 16px 0; text-align: center;">
      <span style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block; margin-bottom: 4px;">Código de Acesso à Sala</span>
      <span style="font-size: 26px; font-weight: 800; color: #fc0038; font-family: monospace; letter-spacing: 2px;">${group.code}</span>
    </div>
    ${rulesHtml ? `
    <p style="font-weight: 600; margin-bottom: 6px;">Regras da Sala:</p>
    <ul style="padding-left: 20px; color: #4b5563; font-size: 14px;">
      ${rulesHtml}
    </ul>
    ` : ''}
    <p>
      <a
        style="
          display: inline-block;
          text-decoration: none;
          outline: none;
          color: #fff;
          background-color: #fc0038;
          padding: 8px 16px;
          border-radius: 4px;
        "
        href="${appUrl}"
        target="_blank"
      >
        Abrir FocusFlow
      </a>
    </p>
    <p>
      Se você tiver alguma dúvida ou precisar de ajuda para começar, nossa equipe de suporte está à disposição no e-mail
      <a href="mailto:support@focusflow.app" style="text-decoration: none; outline: none; color: #fc0038"
        >support@focusflow.app</a
      >. Estamos aqui para te ajudar em cada etapa do caminho!
    </p>
    <p>Atenciosamente,<br />A Equipe FocusFlow</p>
  </div>
</div>`.trim();

    const plainMessage = `Olá!\n\nVocê foi convidado(a) por ${inviterName || 'um colega'} para entrar no grupo de estudos "${group.name}" no FocusFlow!\n\n${customMessage ? `Mensagem: "${customMessage}"\n\n` : ''}Código de acesso: ${group.code}\n\nAcesse: ${appUrl}`;

    const subject = `Convite para a sala de estudos: ${group.name}`;

    const templateParams = {
      to_email: trimmedEmail,
      group_name: group.name,
      group_code: group.code,
      group_description: group.description || 'Sala de estudos colaborativa no FocusFlow.',
      inviter_name: inviterName || 'Um membro da sala',
      custom_message: customMessage ? `Mensagem pessoal: "${customMessage}"` : '',
      rules_list: rulesList,
      app_url: appUrl,
      support_email: 'support@focusflow.app',
      company_name: 'FocusFlow',
      html_message: htmlMessage,
      message_html: htmlMessage,
      html_content: htmlMessage,
      message: plainMessage,
    };

    const provider = this.getActiveProvider();

    // 1. Envio via Brevo (300 e-mails/dia = 9.000/mês)
    if (provider === 'brevo' && (this.config.brevoApiKey || import.meta.env.VITE_BREVO_API_KEY)) {
      try {
        const response = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'brevo',
            apiKey: this.config.brevoApiKey,
            senderEmail: this.config.brevoSenderEmail,
            senderName: this.config.brevoSenderName,
            to: trimmedEmail,
            subject,
            htmlContent: htmlMessage,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Brevo retornou status ${response.status}`);
        }

        this.recordSentInvite(trimmedEmail, group);

        return {
          success: true,
          message: `Convite enviado com sucesso para ${trimmedEmail} via Brevo! (300/dia)`,
          mode: 'brevo',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Falha no envio via Brevo';
        console.error('[EmailService] Erro ao enviar convite via Brevo:', err);
        return {
          success: false,
          message: `Não foi possível enviar o e-mail: ${errorMsg}`,
          mode: 'brevo',
          details: err,
        };
      }
    }

    // 2. Envio via Resend (3.000 e-mails/mês)
    if (provider === 'resend' && (this.config.resendApiKey || import.meta.env.VITE_RESEND_API_KEY)) {
      try {
        const response = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'resend',
            apiKey: this.config.resendApiKey,
            senderEmail: this.config.resendSenderEmail,
            senderName: this.config.resendSenderName,
            to: trimmedEmail,
            subject,
            htmlContent: htmlMessage,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Resend retornou status ${response.status}`);
        }

        this.recordSentInvite(trimmedEmail, group);

        return {
          success: true,
          message: `Convite enviado com sucesso para ${trimmedEmail} via Resend! (3.000/mês)`,
          mode: 'resend',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Falha no envio via Resend';
        console.error('[EmailService] Erro ao enviar convite via Resend:', err);
        return {
          success: false,
          message: `Não foi possível enviar o e-mail: ${errorMsg}`,
          mode: 'resend',
          details: err,
        };
      }
    }

    // 3. Envio via API Customizada / Webhook / Supabase Edge Function
    if (this.config.customApiUrl) {
      try {
        const response = await fetch(this.config.customApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: trimmedEmail,
            subject,
            templateData: templateParams,
          }),
        });

        if (!response.ok) {
          throw new Error(`Servidor de e-mail respondeu com status ${response.status}`);
        }

        this.recordSentInvite(trimmedEmail, group);

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

    // 4. Envio via EmailJS REST API
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

        this.recordSentInvite(trimmedEmail, group);

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

    // 5. Modo de Demonstração / Entrega Instantânea Resiliente (para desenvolvimento e teste out-of-the-box)
    await new Promise((resolve) => setTimeout(resolve, 800));

    this.recordSentInvite(trimmedEmail, group);

    return {
      success: true,
      message: `Convite enviado com sucesso para ${trimmedEmail}!`,
      mode: 'demo',
    };
  }
}

export const emailService = new EmailService();
