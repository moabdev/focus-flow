import { GoogleGenAI, Type, Schema } from '@google/genai';

export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
  tags: string[];
}

export const generateFlashcardsFromNotes = async (
  notes: string,
  apiKey: string,
  count: number = 5
): Promise<GeneratedFlashcard[]> => {
  if (!apiKey) {
    throw new Error('API Key do Gemini não fornecida.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const flashcardSchema: Schema = {
    type: Type.ARRAY,
    description: 'Uma lista de flashcards gerados a partir do texto.',
    items: {
      type: Type.OBJECT,
      properties: {
        front: {
          type: Type.STRING,
          description: 'A pergunta ou conceito a ser lembrado (frente do cartão). Seja direto e claro.',
        },
        back: {
          type: Type.STRING,
          description: 'A resposta ou explicação (verso do cartão).',
        },
        hint: {
          type: Type.STRING,
          description: 'Uma dica opcional curta para ajudar a lembrar a resposta.',
        },
        tags: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Tags curtas para categorizar o flashcard (ex: "história", "fórmula").',
        },
      },
      required: ['front', 'back', 'tags'],
    },
  };

  const systemInstruction = `Você é um assistente de estudos especializado em criar flashcards para a técnica de Repetição Espaçada (Spaced Repetition).
Analise o texto fornecido pelo usuário e crie até ${count} flashcards que capturem os conceitos, fórmulas, datas ou ideias mais importantes.
Não crie perguntas óbvias demais. Foco em retenção de conhecimento. Formate a saída rigidamente no schema JSON solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: notes,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: flashcardSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('A IA não retornou nenhum texto.');
    }

    const flashcards: GeneratedFlashcard[] = JSON.parse(text);
    return flashcards;
  } catch (error) {
    console.error('[Gemini Service] Erro ao gerar flashcards:', error);
    throw error;
  }
};

export interface ProductivityInsights {
  best_times: string;
  schedule_suggestion: string;
  analysis: string;
  motivational_tip: string;
}

export const generateProductivityInsights = async (
  sessionHistorySummary: string,
  apiKey: string
): Promise<ProductivityInsights> => {
  if (!apiKey) {
    throw new Error('API Key do Gemini não fornecida.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const insightsSchema: Schema = {
    type: Type.OBJECT,
    description: 'Insights de produtividade e cronograma sugerido.',
    properties: {
      best_times: {
        type: Type.STRING,
        description: 'Os melhores horários ou turnos em que o usuário mais rende. (Ex: "Manhã", "Entre 14h e 16h")',
      },
      schedule_suggestion: {
        type: Type.STRING,
        description: 'Uma sugestão de cronograma amigável e realista.',
      },
      analysis: {
        type: Type.STRING,
        description: 'Uma análise comportamental sobre o ritmo de estudo do usuário com base nos dados.',
      },
      motivational_tip: {
        type: Type.STRING,
        description: 'Uma frase curta ou dica motivacional.',
      },
    },
    required: ['best_times', 'schedule_suggestion', 'analysis', 'motivational_tip'],
  };

  const systemInstruction = `Você é um Co-piloto de Produtividade (coach de estudos).
Analise o resumo do histórico de sessões de foco (pomodoros) do usuário e gere insights de alto valor.
Identifique padrões: quais horários e dias o usuário rende mais, e faça uma sugestão de um cronograma ideal de estudos com base nisso.
Seja encorajador e prático. Retorne RIGIDAMENTE os dados no schema JSON solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Histórico resumido de sessões:\n${sessionHistorySummary}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: insightsSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('A IA não retornou nenhum texto.');
    }

    const insights: ProductivityInsights = JSON.parse(text);
    return insights;
  } catch (error) {
    console.error('[Gemini Service] Erro ao gerar insights de produtividade:', error);
    throw error;
  }
};

export interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4 options
  correct_answer_index: number; // 0 to 3
  explanation: string;
}

export type GeneratedQuiz = QuizQuestion[];

export const generateQuizFromNotes = async (
  notes: string,
  apiKey: string,
  count: number = 5
): Promise<GeneratedQuiz> => {
  if (!apiKey) {
    throw new Error('API Key do Gemini não fornecida.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const quizSchema: Schema = {
    type: Type.ARRAY,
    description: 'Um quiz de múltipla escolha gerado a partir do texto.',
    items: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: 'A pergunta objetiva.',
        },
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Exatamente 4 opções de resposta, sendo apenas uma a correta e 3 alternativas plausíveis.',
        },
        correct_answer_index: {
          type: Type.INTEGER,
          description: 'O índice (de 0 a 3) da resposta correta no array de opções.',
        },
        explanation: {
          type: Type.STRING,
          description: 'A explicação concisa de por que a resposta correta está certa.',
        },
      },
      required: ['question', 'options', 'correct_answer_index', 'explanation'],
    },
  };

  const systemInstruction = `Você é um professor especializado em criar testes de múltipla escolha para retenção de conhecimento.
Analise o texto fornecido pelo usuário e crie um quiz de ${count} questões.
Cada questão DEVE ter EXATAMENTE 4 opções de resposta e apenas UMA correta.
Retorne o índice correto (0 a 3) e forneça uma explicação educativa.
Formate a saída rigidamente no schema JSON solicitado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: notes,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: quizSchema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('A IA não retornou nenhum texto.');
    }

    const quiz: GeneratedQuiz = JSON.parse(text);
    return quiz;
  } catch (error) {
    console.error('[Gemini Service] Erro ao gerar quiz:', error);
    throw error;
  }
};
