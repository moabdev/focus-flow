import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFlashcardsFromNotes, generateProductivityInsights, generateQuizFromNotes } from '@/services/ai/geminiService';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockImplementation(async ({ config }) => {
          // Return different mocked JSON based on the system instruction or schema description
          if (config.systemInstruction.includes('flashcards')) {
            return {
              text: JSON.stringify([
                { front: 'Front 1', back: 'Back 1', tags: ['t1'] }
              ])
            };
          } else if (config.systemInstruction.includes('Co-piloto')) {
            return {
              text: JSON.stringify({
                best_times: 'Morning',
                schedule_suggestion: 'Study at 9 AM',
                analysis: 'Good',
                motivational_tip: 'Keep going'
              })
            };
          } else if (config.systemInstruction.includes('quiz')) {
            return {
              text: JSON.stringify([
                {
                  question: 'Q1',
                  options: ['A', 'B', 'C', 'D'],
                  correct_answer_index: 0,
                  explanation: 'Because A is right'
                }
              ])
            };
          }
          return { text: '[]' };
        })
      }
    })),
    Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      INTEGER: 'INTEGER'
    }
  };
});

describe('Serviços de IA (Gemini)', () => {
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar flashcards com sucesso', async () => {
    const flashcards = await generateFlashcardsFromNotes('notes', mockApiKey, 1);
    expect(flashcards).toHaveLength(1);
    expect(flashcards[0].front).toBe('Front 1');
    expect(flashcards[0].back).toBe('Back 1');
  });

  it('deve lançar erro se a chave da API dos flashcards não for fornecida', async () => {
    await expect(generateFlashcardsFromNotes('notes', '', 1)).rejects.toThrow('API Key do Gemini não fornecida');
  });

  it('deve gerar insights de produtividade com sucesso', async () => {
    const insights = await generateProductivityInsights('summary', mockApiKey);
    expect(insights.best_times).toBe('Morning');
    expect(insights.analysis).toBe('Good');
  });

  it('deve lançar erro se a chave da API do co-piloto não for fornecida', async () => {
    await expect(generateProductivityInsights('summary', '')).rejects.toThrow('API Key do Gemini não fornecida');
  });

  it('deve gerar quiz com sucesso', async () => {
    const quiz = await generateQuizFromNotes('notes', mockApiKey, 1);
    expect(quiz).toHaveLength(1);
    expect(quiz[0].question).toBe('Q1');
    expect(quiz[0].options).toHaveLength(4);
    expect(quiz[0].correct_answer_index).toBe(0);
  });

  it('deve lançar erro se a chave da API do quiz não for fornecida', async () => {
    await expect(generateQuizFromNotes('notes', '', 1)).rejects.toThrow('API Key do Gemini não fornecida');
  });
});
