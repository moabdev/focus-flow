import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emailService } from '../services/emailService';
import { StudyGroup } from '../types';

describe('EmailService (Envio de Convites de Grupo com 1 Clique - Provedor Brevo)', () => {
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

  describe('2. Envio de Convite com 1 Clique (Modo Demonstração / Fallback)', () => {
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

  describe('3. Envio via Brevo (300 e-mails/dia = 9.000/mês 100% grátis)', () => {
    it('deve despachar para /api/send-invite quando a chave do Brevo estiver presente', async () => {
      vi.spyOn(emailService, 'getConfig').mockReturnValue({
        apiKey: 'xkeysib-mock-valid-key',
        senderEmail: 'admin@estudos.com',
        senderName: 'FocusFlow Estudos',
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, messageId: '<msg-123@brevo>' }),
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'novoaluno@gmail.com',
        group: mockGroup,
        inviterName: 'Professor',
      });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('brevo');
      expect(result.message).toContain('300/dia');
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/send-invite',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"novoaluno@gmail.com"'),
        })
      );
    });

    it('deve tratar erro da API do Brevo graciosamente', async () => {
      vi.spyOn(emailService, 'getConfig').mockReturnValue({
        apiKey: 'xkeysib-mock-invalid-key',
        senderEmail: 'admin@estudos.com',
        senderName: 'FocusFlow Estudos',
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Key not found in Brevo' }),
      } as any);

      const result = await emailService.sendGroupInvite({
        toEmail: 'aluno@gmail.com',
        group: mockGroup,
      });

      expect(result.success).toBe(false);
      expect(result.mode).toBe('brevo');
      expect(result.message).toContain('Key not found in Brevo');
    });
  });

  describe('4. Gestão de Cota Diária do Brevo (300 e-mails por dia)', () => {
    it('deve calcular cota restante de 300 para o Brevo', () => {
      const usage = emailService.getDailyUsage();
      expect(usage.limit).toBe(300);
      expect(usage.remaining).toBe(300);
      expect(usage.count).toBe(0);
    });

    it('deve bloquear envio quando a cota diária de 300 for atingida', async () => {
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
