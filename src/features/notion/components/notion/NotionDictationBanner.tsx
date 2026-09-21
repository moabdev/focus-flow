import React from 'react';

interface NotionDictationBannerProps {
  isListening: boolean;
  interimTranscript: string;
  onStopSpeech: () => void;
}

export const NotionDictationBanner: React.FC<NotionDictationBannerProps> = ({
  isListening,
  interimTranscript,
  onStopSpeech,
}) => {
  if (!isListening) return null;

  return (
    <div className="notion-dictation-banner">
      <div className="dictation-left">
        <span className="dictation-pulse-dot" />
        <span className="dictation-label">🎙️ Ditando em tempo real:</span>
        <span className="dictation-preview">
          {interimTranscript ? `"${interimTranscript}"` : 'Fale suas anotações... sua voz será transcrita no cursor.'}
        </span>
      </div>
      <button
        type="button"
        className="dictation-stop-btn"
        onClick={onStopSpeech}
        title="Parar ditado por voz"
      >
        Parar Ditado
      </button>
    </div>
  );
};
