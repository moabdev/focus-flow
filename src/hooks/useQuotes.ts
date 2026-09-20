import { useState, useEffect, useCallback } from 'react';
import { Quote } from '../types';
import { INITIAL_QUOTES } from '../services/quotesData';
import { storageService } from '../services/storage';

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [activeQuote, setActiveQuote] = useState<Quote>(INITIAL_QUOTES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Carrega mantras salvos no storage
  useEffect(() => {
    const savedMantras = storageService.getMantras();
    if (savedMantras.length > 0) {
      const mantraQuotes: Quote[] = savedMantras.map((text, idx) => ({
        id: `mantra-${idx}`,
        text,
        author: 'Meu Mantra Pessoal',
        category: 'foco',
        isMantra: true,
      }));
      setQuotes([...mantraQuotes, ...INITIAL_QUOTES]);
      // Se tiver mantra, começa exibindo o mantra
      setActiveQuote(mantraQuotes[0]);
    }
  }, []);

  const getRandomQuote = useCallback(() => {
    setIsRotating(true);
    setTimeout(() => {
      const filtered = selectedCategory === 'todas'
        ? quotes
        : quotes.filter((q) => q.category === selectedCategory);

      const pool = filtered.length > 0 ? filtered : quotes;
      const nextIndex = Math.floor(Math.random() * pool.length);
      setActiveQuote(pool[nextIndex]);
      setIsRotating(false);
    }, 250);
  }, [quotes, selectedCategory]);

  const addMantra = (text: string) => {
    if (!text.trim()) return;
    const currentMantras = storageService.getMantras();
    const updated = [text.trim(), ...currentMantras];
    storageService.saveMantras(updated);

    const newMantra: Quote = {
      id: `mantra-${Date.now()}`,
      text: text.trim(),
      author: 'Meu Mantra Pessoal',
      category: 'foco',
      isMantra: true,
    };

    setQuotes((prev) => [newMantra, ...prev]);
    setActiveQuote(newMantra);
  };

  const clearMantras = useCallback(() => {
    setQuotes(INITIAL_QUOTES);
    setActiveQuote(INITIAL_QUOTES[0]);
  }, []);

  return {
    activeQuote,
    selectedCategory,
    setSelectedCategory,
    getRandomQuote,
    addMantra,
    clearMantras,
    isRotating,
  };
}
