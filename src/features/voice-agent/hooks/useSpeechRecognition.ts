import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserSpeechRecognition } from '@/services/ai/voiceAgentService';
import { useToast } from '@/features/core/contexts/ToastContext';

export interface UseSpeechRecognitionProps {
  onFinalResult: (transcript: string) => void;
  onStatusChange: (status: 'idle' | 'listening') => void;
}

export const useSpeechRecognition = ({ onFinalResult, onStatusChange }: UseSpeechRecognitionProps) => {
  const toast = useToast();
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    speechRecognitionRef.current = new BrowserSpeechRecognition();

    return () => {
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSpeechSupported = !!speechRecognitionRef.current?.isSupported();

  const stopListening = useCallback(() => {
    speechRecognitionRef.current?.stop();
    onStatusChange('idle');
    setAudioLevel(0);

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, [onStatusChange]);

  const startListening = useCallback(() => {
    if (!speechRecognitionRef.current) {
      toast.error('Reconhecimento de voz não suportado neste navegador.', 'STT Indisponível');
      return;
    }

    setErrorMessage(null);
    setTranscript('');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          micStreamRef.current = stream;
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(1, avg / 128));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        })
        .catch((err) => {
          console.warn('[useSpeechRecognition] Microfone não acessível para áudio analyzer:', err);
        });
    }

    speechRecognitionRef.current.start({
      onStart: () => {
        onStatusChange('listening');
      },
      onInterimResult: (partial) => {
        setTranscript(partial);
      },
      onFinalResult: (final) => {
        setTranscript(final);
        onFinalResult(final);
      },
      onError: (err) => {
        console.warn('[useSpeechRecognition] Erro no STT:', err);
        onStatusChange('idle');
        setAudioLevel(0);
        if (err.includes('not-allowed') || err.includes('permission')) {
          setErrorMessage('Permissão de microfone negada no navegador.');
          toast.error('Habilite o microfone nas permissões do site.', 'Microfone Bloqueado');
        }
      },
      onEnd: () => {
        setAudioLevel(0);
        onStatusChange('idle');
      },
    });
  }, [onFinalResult, onStatusChange, toast]);

  return {
    transcript,
    setTranscript,
    errorMessage,
    setErrorMessage,
    audioLevel,
    isSpeechSupported,
    startListening,
    stopListening,
  };
};
