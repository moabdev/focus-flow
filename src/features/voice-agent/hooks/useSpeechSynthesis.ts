import { useRef, useCallback, useEffect } from 'react';
import { BrowserSpeechSynthesis } from '@/services/ai/voiceAgentService';

export interface UseSpeechSynthesisProps {
  isMuted: boolean;
  onStatusChange: (status: 'idle' | 'speaking') => void;
}

export const useSpeechSynthesis = ({ isMuted, onStatusChange }: UseSpeechSynthesisProps) => {
  const speechSynthesisRef = useRef<BrowserSpeechSynthesis | null>(null);

  useEffect(() => {
    speechSynthesisRef.current = new BrowserSpeechSynthesis();
    return () => {
      speechSynthesisRef.current?.stop();
    };
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !speechSynthesisRef.current) return;

      onStatusChange('speaking');
      speechSynthesisRef.current.speak(text, {
        onStart: () => onStatusChange('speaking'),
        onEnd: () => onStatusChange('idle'),
        onError: () => onStatusChange('idle'),
      });
    },
    [isMuted, onStatusChange]
  );

  const stopSpeaking = useCallback(() => {
    speechSynthesisRef.current?.stop();
    onStatusChange('idle');
  }, [onStatusChange]);

  return {
    speakText,
    stopSpeaking,
  };
};
