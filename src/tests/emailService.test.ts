import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emailService } from '../services/emailService';
import { StudyGroup } from '../types';

describe('EmailService (Envio de Convites de Grupo com 1 Clique)', () => {
  const mockGroup: StudyGroup = {
    id: 'grp-123',
    name: 'Engenharia de Software',
    description: 'Grupo focado em algoritmos e sistemas distribuídos.',
    category: 'Tecnologia',
    avatar_icon: '💻',
    code: 'ENG-2026',
    member_count: 5,
    created_at: new Date().toISOString(),
    rules: [
      'Foco total nos blocos de 25 minutos',
      'Sem distrações no chat durante o Pomodoro',
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    emailService.saveConfig({
      serviceId: '',
      templateId: '',
      publicKey: '',
      customApiUrl: '',
    });
  });

  describe('1. Validação de Sintaxe de E-mail', () => {
    it('deve aceitar e-mails válidos', () => {
      expect(emailService.isValidEmail('aluno@focusflow.app')).toBe(true);
      expect(emailService.isValidEmail('carlos.silva+estudos@gmail.com')).toBe(true);
      expect(emailService.isValidEmail('contato@universidade.edu.br')).toBe(true);
    });

    it('deve rejeitar e-mails com formatos inválidos', () => {
      expect(emailService.isValidEmail('')).toBe(false);
      expect(emailService.isValidEmail('invalido')).toBe(false);
      expect(emailService.isValidEmail('aluno@')).toBe(false);
      expect(emailService.isValidEmail('@dominio.com')).toBe(false);
      expect(emailService.isValidEmail('aluno@dominio')).toBe(false);
      expect(emailService.isValidEmail('aluno @dominio.com')).toBe(false);
    });
  });

  describe('2. Envio de Convite com 1 Clique (Modo Demonstração / Out-of-the-box)', () => {
    it('deve rejeitar envio quando o e-mail estiver em branco', async () => {
      const result = await emailService.sendGroupInvite({
        toEmail: '   ',
        group: mockGroup,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('informe um endereço de e-mail');
    });

    it('deve rejeitar envio quando o e-mail for inválido', async () => {
      const result = await emailService.sendGroupInvite({
        toEmail: 'email-sem-formato-correto',
        group: mockGroup,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Endereço de e-mail inválido');
    });

    it('deve enviar convite com 1 clique e registrar histórico local', async () => {
      const result = await emailService.sendGroupInvite({
        toEmail: 'colega@exemplo.com',
        group: mockGroup,
        inviterName: 'Moab Dev',
        customMessage: 'Vamos estudar juntos hoje!',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('demo');
      expect(result.message).toContain('colega@exemplo.com');

      // Verifica registro no histórico de convites disparados
      const history = JSON.parse(localStorage.getItem('focusflow_sent_invites') || '[]');
      expect(history.length).toBe(1);
      expect(history[0].email).toBe('colega@exemplo.com');
      expect(history[0].groupCode).toBe('ENG-2026');
    });
  });

  describe('3. Envio via EmailJS REST API', () => {
    it('deve disparar POST para o endpoint do EmailJS quando configurado', async () => {
      emailService.saveConfig({
        serviceId: 'service_focus',
        templateId: 'template_invite',
        publicKey: 'pub_key_123',
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('OK'),
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'dev@focusflow.app',
        group: mockGroup,
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('emailjs');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.emailjs.com/api/v1.0/email/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('deve tratar erro quando a API do EmailJS retornar resposta não-OK', async () => {
      emailService.saveConfig({
        serviceId: 'service_focus',
        templateId: 'template_invite',
        publicKey: 'pub_key_123',
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('Invalid template ID'),
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'dev@focusflow.app',
        group: mockGroup,
      });

      expect(result.success).toBe(false);
      expect(result.mode).toBe('emailjs');
      expect(result.message).toContain('Invalid template ID');
    });
  });

  describe('4. Envio via API Customizada / Webhook', () => {
    it('deve despachar para URL customizada quando configurada', async () => {
      emailService.saveConfig({
        customApiUrl: 'https://api.focusflow.app/v1/send-invite',
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'amigo@exemplo.com',
        group: mockGroup,
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('custom_api');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.focusflow.app/v1/send-invite',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('5. Envio via Brevo (300 e-mails/dia = 9.000/mês grátis)', () => {
    it('deve despachar para /api/send-invite com provedor brevo quando configurado', async () => {
      emailService.saveConfig({
        provider: 'brevo',
        brevoApiKey: 'xkeysib-test-12345',
        brevoSenderEmail: 'admin@estudos.com',
        brevoSenderName: 'FocusFlow Estudos',
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, messageId: '<msg-123@brevo>' }),
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'novoaluno@gmail.com',
        group: mockGroup,
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('brevo');
      expect(result.message).toContain('300/dia');
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/send-invite',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"provider":"brevo"'),
        })
      );
    });
  });

  describe('6. Gestão de Cota Diária (300 no Brevo / 100 no Resend)', () => {
    it('deve calcular cota restante de 300 para Brevo', () => {
      emailService.saveConfig({ provider: 'brevo' });
      const usage = emailService.getDailyUsage();
      expect(usage.limit).toBe(300);
      expect(usage.remaining).toBe(300);
      expect(usage.count).toBe(0);
    });

    it('deve bloquear envio quando a cota diária for atingida', async () => {
      emailService.saveConfig({ provider: 'brevo' });
      const todayStr = new Date().toISOString().split('T')[0];

      // Simula 300 envios registrados hoje
      const fakeHistory = Array.from({ length: 300 }, (_, i) => ({
        email: `aluno${i}@gmail.com`,
        groupId: mockGroup.id,
        groupCode: mockGroup.code,
        sentAt: `${todayStr}T10:00:00.000Z`,
      }));
      localStorage.setItem('focusflow_sent_invites', JSON.stringify(fakeHistory));

      const usage = emailService.getDailyUsage();
      expect(usage.count).toBe(300);
      expect(usage.remaining).toBe(0);

      const result = await emailService.sendGroupInvite({
        toEmail: 'extra@gmail.com',
        group: mockGroup,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Limite diário de 300 e-mails atingido hoje');
    });
  });
});
