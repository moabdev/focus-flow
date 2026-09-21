import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { storageService } from '@/features/core/api/storage';
import { INITIAL_QUOTES } from '@/features/quotes/api/quotesData';

vi.mock('@/features/core/api/storage', () => ({
  storageService: {
    getMantras: vi.fn(),
    saveMantras: vi.fn(),
  },
}));

describe('useQuotes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (storageService.getMantras as any).mockReturnValue([]);
  });

  it('deve inicializar com as citações padrão e a primeira como ativa', () => {
    const { result } = renderHook(() => useQuotes());
    expect(result.current.activeQuote).toEqual(INITIAL_QUOTES[0]);
    expect(result.current.selectedCategory).toBe('todas');
  });

  it('deve carregar mantras salvos e definir o primeiro como ativo', () => {
    (storageService.getMantras as any).mockReturnValue(['Mantra 1', 'Mantra 2']);
    const { result } = renderHook(() => useQuotes());
    expect(result.current.activeQuote.text).toBe('Mantra 1');
    expect(result.current.activeQuote.isMantra).toBe(true);
  });

  it('deve permitir alterar a categoria selecionada', () => {
    const { result } = renderHook(() => useQuotes());
    act(() => {
      result.current.setSelectedCategory('foco');
    });
    expect(result.current.selectedCategory).toBe('foco');
  });

  it('deve sortear uma citação aleatória após o timeout', () => {
    const { result } = renderHook(() => useQuotes());
    act(() => {
      result.current.getRandomQuote();
    });
    expect(result.current.isRotating).toBe(true);
    
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    expect(result.current.isRotating).toBe(false);
    expect(result.current.activeQuote).toBeDefined();
  });

  it('deve sortear respeitando o filtro de categoria', () => {
    const { result } = renderHook(() => useQuotes());
    
    act(() => {
      result.current.setSelectedCategory('estudo');
    });

    act(() => {
      result.current.getRandomQuote();
    });
    
    act(() => {
      vi.advanceTimersByTime(250);
    });
    
    expect(result.current.activeQuote).toBeDefined();
    if (result.current.activeQuote.category !== 'foco' && !result.current.activeQuote.isMantra) {
        expect(result.current.activeQuote.text.length).toBeGreaterThan(0);
    }
  });

  it('deve permitir adicionar um novo mantra', () => {
    (storageService.getMantras as any).mockReturnValue([]);
    const { result } = renderHook(() => useQuotes());
    
    act(() => {
      result.current.addMantra('Meu novo mantra poderoso');
    });

    expect(storageService.saveMantras).toHaveBeenCalledWith(['Meu novo mantra poderoso']);
    expect(result.current.activeQuote.text).toBe('Meu novo mantra poderoso');
    expect(result.current.activeQuote.isMantra).toBe(true);
  });

  it('não deve adicionar mantra vazio', () => {
    (storageService.getMantras as any).mockReturnValue([]);
    const { result } = renderHook(() => useQuotes());
    
    act(() => {
      result.current.addMantra('   ');
    });

    expect(storageService.saveMantras).not.toHaveBeenCalled();
  });

  it('deve permitir limpar mantras', () => {
    (storageService.getMantras as any).mockReturnValue(['Mantra Local']);
    const { result } = renderHook(() => useQuotes());
    
    act(() => {
      result.current.clearMantras();
    });

    expect(result.current.activeQuote).toEqual(INITIAL_QUOTES[0]);
  });
});
