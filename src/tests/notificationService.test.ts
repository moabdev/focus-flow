import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../services/notificationService';

describe('NotificationService (Notificações Nativas)', () => {
  beforeEach(() => {
    (window as any).Notification = class MockNotification {
      static permission = 'default';
      static requestPermission = vi.fn().mockResolvedValue('granted');
      constructor(public title: string, public options?: any) {}
    };
  });

  it('deve identificar corretamente suporte ao Notification API', () => {
    expect(typeof notificationService.isSupported()).toBe('boolean');
  });

  it('deve lidar com requestPermission de forma segura', async () => {
    const granted = await notificationService.requestPermission();
    expect((window as any).Notification.requestPermission).toHaveBeenCalled();
    expect(granted).toBe(true);
  });

  it('não deve quebrar ao chamar notifyTimerComplete', () => {
    expect(() => {
      notificationService.notifyTimerComplete('pomodoro', 'Matemática');
      notificationService.notifyTimerComplete('shortBreak');
    }).not.toThrow();
  });
});
