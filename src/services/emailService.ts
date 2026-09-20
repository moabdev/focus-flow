import { StudyGroup } from '../types';

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
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
  mode: 'brevo' | 'demo';
  details?: unknown;
}

export interface DailyQuotaUsage {
  count: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

export const BREVO_DAILY_LIMIT = 300; // 300 e-mails por dia (~9.000/mês 100% grátis)
const HISTORY_KEY = 'focusflow_sent_invites';

class EmailService {
  /**
   * Lê as configurações exclusivamente das variáveis de ambiente (.env)
   */
  public getConfig(): BrevoConfig {
    return {
      apiKey: (import.meta.env.VITE_BREVO_API_KEY as string) || '',
      senderEmail: (import.meta.env.VITE_BREVO_SENDER_EMAIL as string) || '',
      senderName: (import.meta.env.VITE_BREVO_SENDER_NAME as string) || 'FocusFlow',
    };
  }

  public isConfigured(): boolean {
    const config = this.getConfig();
    return !!config.apiKey;
  }

  public isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Retorna os envios realizados hoje e a cota restante (300/dia no Brevo)
   */
  public getDailyUsage(): DailyQuotaUsage {
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
        limit: BREVO_DAILY_LIMIT,
        remaining: Math.max(0, BREVO_DAILY_LIMIT - todayCount),
        resetDate: todayStr,
      };
    } catch {
      return {
        count: 0,
        limit: BREVO_DAILY_LIMIT,
        remaining: BREVO_DAILY_LIMIT,
        resetDate: todayStr,
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
   * Envia convite de sala de estudos para o e-mail informado com 1 clique via Brevo
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
        mode: 'brevo',
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

    // Template HTML customizado com as cores e estrutura solicitadas
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

    const subject = `Convite para a sala de estudos: ${group.name}`;
    const config = this.getConfig();

    // 1. Envio Real via Brevo (/api/send-invite) quando VITE_BREVO_API_KEY estiver configurada
    if (config.apiKey) {
      try {
        const response = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.apiKey,
            senderEmail: config.senderEmail,
            senderName: config.senderName,
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

    // 2. Modo de Demonstração / Fallback Instantâneo (quando ainda não configurado no .env)
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
