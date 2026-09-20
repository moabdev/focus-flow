import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do AudioContext para ambientes de teste (Node / jsdom)
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createBuffer() {
    return {
      getChannelData: () => new Float32Array(44100),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      connect: vi.fn(),
    };
  }

  resume = vi.fn().mockResolvedValue(undefined);
}

// Injeta mocks globais
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do scrollIntoView para jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();
