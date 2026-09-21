import React from 'react';
import { Mic, Sparkles, AlertCircle } from 'lucide-react';
import { AgentStatus } from '../hooks/useVoiceAgent';

interface VoiceAgentButtonProps {
  status: AgentStatus;
  isOpen: boolean;
  onClick: () => void;
}

export const VoiceAgentButton: React.FC<VoiceAgentButtonProps> = ({
  status,
  isOpen,
  onClick,
}) => {
  return (
    <div className="voice-agent-fab-container">
      {/* Ondas pulsantes de escuta */}
      {(status === 'listening' || status === 'speaking') && (
        <>
          <div className="voice-agent-ripple" />
          <div className="voice-agent-ripple" />
        </>
      )}

      {/* Anel giratório para estado thinking */}
      {status === 'thinking' && <div className="voice-agent-spinner-ring" />}

      <button
        type="button"
        id="voice-agent-fab-button"
        onClick={onClick}
        className={`voice-agent-fab-btn ${isOpen ? 'active' : ''}`}
        title={isOpen ? 'Fechar Voice Copilot' : 'Abrir Voice Copilot (Falar com o Flow)'}
        aria-label="Abrir assistente de voz Flow Copilot"
      >
        {status === 'listening' ? (
          <Mic className="w-6 h-6 animate-pulse text-white" />
        ) : status === 'error' ? (
          <AlertCircle className="w-6 h-6 text-red-200" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}

        {/* Badge indicador de status */}
        <span
          className={`voice-agent-status-badge ${status}`}
          title={`Status: ${status}`}
        />
      </button>
    </div>
  );
};
