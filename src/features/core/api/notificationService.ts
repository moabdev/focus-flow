class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }
    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public isGranted(): boolean {
    return this.hasPermission;
  }

  public notify(title: string, body: string, icon?: string): void {
    if (!this.hasPermission || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    try {
      new Notification(title, {
        body,
        icon: icon || '/pwa-icon.png',
        badge: icon || '/pwa-icon.png',
        silent: false,
      });
    } catch (err) {
      console.warn('[NotificationService] Falha ao exibir notificação:', err);
    }
  }

  public notifyTimerComplete(mode: 'pomodoro' | 'shortBreak' | 'longBreak', taskTitle?: string): void {
    if (mode === 'pomodoro') {
      this.notify(
        '🍅 Ciclo de Foco Concluído!',
        taskTitle
          ? `Parabéns! Você finalizou o foco em "${taskTitle}". Hora de descansar!`
          : 'Excelente sessão de foco! Faça uma pausa para recarregar suas energias.'
      );
    } else {
      this.notify(
        '⚡ Intervalo Finalizado!',
        'Sua pausa terminou. Pronto para o próximo bloco de alta performance?'
      );
    }
  }
}

export const notificationService = new NotificationService();
