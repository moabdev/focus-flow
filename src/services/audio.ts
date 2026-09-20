// Motor de Áudio Nativo via Web Audio API (100% Offline, sem dependência de links externos)
import { AlarmSound, AmbientSound } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbient: AmbientSound = 'none';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- Efeitos Sonoros de Conclusão de Ciclo (Alarmes Sintetizados) ---
  public playAlarm(type: AlarmSound, volume: number = 0.8): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), now);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'crystal':
        this.playCrystalChime(ctx, masterGain, now);
        break;
      case 'bell':
        this.playZenBell(ctx, masterGain, now);
        break;
      case 'digital':
        this.playDigitalBeeps(ctx, masterGain, now);
        break;
      case 'marimba':
        this.playMarimbaChime(ctx, masterGain, now);
        break;
      default:
        this.playCrystalChime(ctx, masterGain, now);
    }
  }

  private playCrystalChime(ctx: AudioContext, destination: GainNode, now: number): void {
    // Acorde de Cristal Triplo (Lá menor com nona / luminoso)
    const freqs = [880, 1108.73, 1318.51, 1760];
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime);
      osc.stop(startTime + 1.8);
    });
  }

  private playZenBell(ctx: AudioContext, destination: GainNode, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now); // 528Hz Solfeggio / Transformação

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 3.0);
  }

  private playDigitalBeeps(ctx: AudioContext, destination: GainNode, now: number): void {
    const tones = [587.33, 783.99, 987.77]; // Ré, Sol, Si
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  private playMarimbaChime(ctx: AudioContext, destination: GainNode, now: number): void {
    const freqs = [440, 659.25, 880];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  // Som sutil de clique para botões
  public playClick(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignora silenciosamente se o contexto de áudio não tiver interação
    }
  }

  // --- Gerador de Áudio Ambiente Contínuo (Brown Noise, Chuva, Ruído Branco) ---
  public setAmbient(type: AmbientSound, volume: number = 0.5): void {
    if (this.currentAmbient === type) {
      this.setAmbientVolume(volume);
      return;
    }

    this.stopAmbient();
    this.currentAmbient = type;

    if (type === 'none') return;

    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 4; // 4 segundos de loop contínuo suave
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'brownNoise') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // Normaliza ganho
      }
    } else if (type === 'rain') {
      // Chuva: Ruído rosa filtrado com ressonância aleatória
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.4;
      }
    } else if (type === 'whiteNoise') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filtro para suavizar frequências agudas e tornar relaxante
    const filter = ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
    } else if (type === 'brownNoise') {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 2500;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.01, Math.min(1, volume * 0.6)), ctx.currentTime + 1.0);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    this.ambientSource = source;
    this.ambientGain = gainNode;
  }

  public setAmbientVolume(volume: number): void {
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(Math.max(0.001, Math.min(1, volume * 0.6)), now + 0.1);
    }
  }

  public stopAmbient(): void {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch {
        // Source already stopped
      }
      this.ambientSource = null;
    }
    this.ambientGain = null;
    this.currentAmbient = 'none';
  }
}

export const soundEngine = new SoundEngine();
