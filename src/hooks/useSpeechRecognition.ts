import { useState, useEffect, useRef, useCallback } from 'react';

// Tipos para compatibilidade com Web Speech API (Chrome, Edge, Safari)
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    lang = 'pt-BR',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isManuallyStopped = useRef(false);

  // Verifica se o navegador possui suporte à Web Speech API
  const isSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    isManuallyStopped.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignora caso já esteja parado
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = 'Seu navegador não suporta reconhecimento de voz nativo. Recomendamos usar o Google Chrome ou Microsoft Edge.';
      setErrorMessage(msg);
      onError?.(msg);
      return;
    }

    setErrorMessage(null);
    setInterimTranscript('');
    isManuallyStopped.current = false;

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      // Se já houver uma instância ativa, encerra antes de recriar
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
          onResult?.(currentInterim, false);
        }

        if (currentFinal) {
          setInterimTranscript('');
          onResult?.(currentFinal, true);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        let errorText = 'Erro ao capturar áudio.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorText = 'Permissão de microfone negada. Permita o microfone no navegador.';
        } else if (event.error === 'no-speech') {
          // Silêncio detectado, não interrompe se for contínuo
          return;
        } else if (event.error === 'network') {
          errorText = 'Erro de rede no serviço de transcrição do navegador.';
        }

        setErrorMessage(errorText);
        onError?.(errorText);
        setIsListening(false);
      };

      recognition.onend = () => {
        // Se o usuário não pediu para parar e estamos em modo contínuo, tenta reiniciar suavemente
        if (!isManuallyStopped.current && continuous) {
          try {
            recognition.start();
            return;
          } catch (_) {}
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const msg = err?.message || 'Falha ao inicializar o microfone.';
      setErrorMessage(msg);
      onError?.(msg);
      setIsListening(false);
    }
  }, [isSupported, lang, continuous, interimResults, onResult, onError]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
};
