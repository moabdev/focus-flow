import { GoogleGenAI } from '@google/genai';
import { AgentAppContext, AgentResponse, AgentToolCall } from './voiceAgentTypes';
import { voiceAgentFunctionDeclarations } from './voiceAgentDeclarations';
import { buildSystemInstruction } from './voiceAgentPrompts';

export * from './voiceAgentTypes';
export * from './voiceAgentDeclarations';
export * from './voiceAgentPrompts';

/**
 * Envia uma mensagem ou transcrição de voz para o Gemini com Function Calling
 */
export const processVoiceAgentMessage = async (
  prompt: string,
  context: AgentAppContext,
  apiKey: string,
  history: { role: 'user' | 'model'; content: string }[] = []
): Promise<AgentResponse> => {
  if (!apiKey) {
    throw new Error('API Key do Gemini não configurada.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(context);

  const formattedContents = [
    ...history.slice(-4).map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: voiceAgentFunctionDeclarations }],
      },
    });

    const toolCalls: AgentToolCall[] = [];
    const functionCalls = response.functionCalls;

    if (functionCalls && Array.isArray(functionCalls)) {
      for (const fc of functionCalls) {
        toolCalls.push({
          name: fc.name as any,
          args: (fc.args || {}) as any,
        });
      }
    }

    let speechText = response.text || '';
    if (!speechText && toolCalls.length > 0) {
      // Fallback amigável se o modelo apenas chamou a tool sem gerar texto
      const firstCall = toolCalls[0];
      if (firstCall.name === 'controlPomodoro') speechText = 'Ajustando o timer para você!';
      else if (firstCall.name === 'manageTasks') speechText = 'Tarefa atualizada no seu painel.';
      else if (firstCall.name === 'manageCalendar') speechText = 'Evento sincronizado na sua agenda.';
      else if (firstCall.name === 'navigateApp') speechText = 'Navegando para a tela solicitada.';
      else if (firstCall.name === 'createStudyMaterial') speechText = 'Material salvo nas suas anotações.';
      else speechText = 'Ação executada com sucesso.';
    }

    return {
      speechText,
      toolCalls,
    };
  } catch (error) {
    console.error('[VoiceAgentService] Erro ao processar mensagem:', error);
    throw error;
  }
};

/**
 * Utilitários para Web Speech API (Speech Recognition & Speech Synthesis)
 */

export interface SpeechRecognitionHandlers {
  onInterimResult: (transcript: string) => void;
  onFinalResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class BrowserSpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(handlers: SpeechRecognitionHandlers): void {
    if (!this.recognition) {
      handlers.onError('Web Speech API não suportada neste navegador.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (interimTranscript) {
        handlers.onInterimResult(interimTranscript);
      }
      if (finalTranscript) {
        handlers.onFinalResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      handlers.onError(event.error || 'Erro no reconhecimento de voz.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('[BrowserSpeechRecognition] Erro ao iniciar:', err);
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[BrowserSpeechRecognition] Erro ao parar:', err);
      }
      this.isListening = false;
    }
  }
}

export class BrowserSpeechSynthesis {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Tentar selecionar voz natural em pt-BR se disponível
    const voices = this.synth.getVoices();
    const ptVoice =
      voices.find((v) => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Natural'))) ||
      voices.find((v) => v.lang.startsWith('pt'));

    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      options.onError?.(err);
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}
