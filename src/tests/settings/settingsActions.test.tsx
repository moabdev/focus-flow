import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService, DEFAULT_SETTINGS } from '@/features/core/api/storage';
import { UserSettings } from '@/features/core/types';

describe('Ações de Configurações do Usuário (Timer, Sons, Modo Estrito e Temas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve retornar DEFAULT_SETTINGS quando nenhuma configuração customizada existir', () => {
    const settings = storageService.getSettings();

    expect(settings.pomodoro_time).toBe(DEFAULT_SETTINGS.pomodoro_time);
    expect(settings.short_break_time).toBe(DEFAULT_SETTINGS.short_break_time);
    expect(settings.long_break_time).toBe(DEFAULT_SETTINGS.long_break_time);
    expect(settings.long_break_interval).toBe(DEFAULT_SETTINGS.long_break_interval);
    expect(settings.sound_volume).toBe(0.8);
    expect(settings.strict_focus_mode).toBe(false);
  });

  it('deve atualizar a duração dos ciclos de pomodoro e pausas', () => {
    const customSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      pomodoro_time: 50,
      short_break_time: 10,
      long_break_time: 30,
      long_break_interval: 3,
    };

    storageService.saveSettings(customSettings);

    const saved = storageService.getSettings();
    expect(saved.pomodoro_time).toBe(50);
    expect(saved.short_break_time).toBe(10);
    expect(saved.long_break_time).toBe(30);
    expect(saved.long_break_interval).toBe(3);
  });

  it('deve alternar a ativação do Modo Estrito (strict_focus_mode)', () => {
    expect(storageService.getSettings().strict_focus_mode).toBe(false);

    const updated: UserSettings = {
      ...DEFAULT_SETTINGS,
      strict_focus_mode: true,
    };
    storageService.saveSettings(updated);

    expect(storageService.getSettings().strict_focus_mode).toBe(true);
  });

  it('deve alternar sons de alerta, som ambiente e volumes', () => {
    const updated: UserSettings = {
      ...DEFAULT_SETTINGS,
      sound_volume: 0.4,
      ambient_volume: 0.6,
      alarm_sound: 'digital',
      ambient_sound: 'rain',
    };
    storageService.saveSettings(updated);

    const loaded = storageService.getSettings();
    expect(loaded.sound_volume).toBe(0.4);
    expect(loaded.ambient_volume).toBe(0.6);
    expect(loaded.alarm_sound).toBe('digital');
    expect(loaded.ambient_sound).toBe('rain');
  });

  it('deve alternar tema visual e modo de cores', () => {
    const updated: UserSettings = {
      ...DEFAULT_SETTINGS,
      theme: 'matcha',
      color_mode: 'light',
    };
    storageService.saveSettings(updated);

    const loaded = storageService.getSettings();
    expect(loaded.theme).toBe('matcha');
    expect(loaded.color_mode).toBe('light');
  });

  it('deve salvar e carregar notas do scratchpad e mantras de foco', () => {
    storageService.saveScratchpad('Minhas anotações rápidas durante o estudo.');
    expect(storageService.getScratchpad()).toBe('Minhas anotações rápidas durante o estudo.');

    storageService.saveMantras(['Foco é a arte de dizer não.', 'Consistência vence a intensidade.']);
    const loadedMantras = storageService.getMantras();
    expect(loadedMantras.length).toBe(2);
    expect(loadedMantras[0]).toBe('Foco é a arte de dizer não.');
  });
});
