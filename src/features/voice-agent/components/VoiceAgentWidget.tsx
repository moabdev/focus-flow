import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  Zap,
  CheckSquare,
  Calendar,
  Flame,
} from 'lucide-react';
import {
  AgentChatMessage,
  AgentStatus,
} from '../hooks/useVoiceAgent';
import { VoiceWaveform } from './VoiceWaveform';

interface VoiceAgentWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  status: AgentStatus;
  messages: AgentChatMessage[];
  transcript: string;
  isMuted: boolean;
  onToggleMute: () => void;
  audioLevel: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  errorMessage: string | null;
}

const QUICK_SUGGESTIONS = [
  { icon: Zap, label: 'Iniciar 25 min de foco', prompt: 'Inicie um pomodoro de 25 minutos' },
  { icon: CheckSquare, label: 'Criar tarefa', prompt: 'Crie uma tarefa de prioridade alta para hoje' },
  { icon: Calendar, label: 'O que tenho hoje?', prompt: 'Quais eventos e tarefas tenho hoje?' },
  { icon: Flame, label: 'Me dê um mantra', prompt: 'Crie um mantra motivacional para meu foco' },
];

export const VoiceAgentWidget: React.FC<VoiceAgentWidgetProps> = ({
  isOpen,
  onClose,
  status,
  messages,
  transcript,
  isMuted,
  onToggleMute,
  audioLevel,
  onStartListening,
  onStopListening,
  onSendMessage,
  onClearHistory,
  errorMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, transcript]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || status === 'thinking') return;
    const textToSend = inputText;
    setInputText('');
    await onSendMessage(textToSend);
  };

  const handleMicToggle = () => {
    if (status === 'listening') {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleChipClick = async (prompt: string) => {
    if (status === 'thinking') return;
    await onSendMessage(prompt);
  };

  return (
    <div className="voice-widget-card" role="dialog" aria-label="Flow Voice Copilot">
      {/* Header Superior */}
      <div className="voice-widget-header">
        <div className="voice-widget-title-wrapper">
          <div className="voice-widget-avatar">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="voice-widget-title-area">
            <h3>
              Flow Copilot
              <span className="voice-widget-tag">Voz & IA</span>
            </h3>
            <span className="voice-widget-status-text">
              <span className={`inline-block w-2 h-2 rounded-full ${
                status === 'listening' ? 'bg-sky-400 animate-ping' :
                status === 'thinking' ? 'bg-purple-400 animate-pulse' :
                status === 'speaking' ? 'bg-rose-400 animate-pulse' :
                status === 'error' ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
              {status === 'listening' ? 'Escutando...' :
               status === 'thinking' ? 'Processando...' :
               status === 'speaking' ? 'Falando...' :
               status === 'error' ? 'Atenção' : 'Pronto para ouvir'}
            </span>
          </div>
        </div>

        <div className="voice-widget-actions">
          <button
            type="button"
            onClick={onToggleMute}
            className={`voice-header-btn ${isMuted ? 'active' : ''}`}
            title={isMuted ? 'Desmutar voz do assistente' : 'Mutar voz do assistente'}
            aria-label="Controle de áudio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            className="voice-header-btn"
            title="Limpar conversa"
            aria-label="Limpar histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="voice-header-btn"
            title="Fechar widget"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div className="voice-widget-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`voice-bubble-wrapper ${msg.role}`}>
            <div className={`voice-bubble ${msg.role}`}>
              <div>{msg.content}</div>

              {/* Ação executada pelo assistente */}
              {msg.actionSummary && (
                <div className="voice-bubble-action">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                  <span>{msg.actionSummary}</span>
                </div>
              )}
            </div>

            <div className="voice-bubble-meta">
              <Clock className="w-2.5 h-2.5" />
              {msg.timestamp}
            </div>
          </div>
        ))}

        {/* Sugestões rápidas se houver poucas mensagens */}
        {messages.length <= 1 && (
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Sugestões rápidas:
            </span>
            <div className="voice-quick-chips">
              {QUICK_SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(item.prompt)}
                    className="voice-chip-btn"
                  >
                    <Icon className="w-3 h-3 text-rose-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Transcrição ao vivo */}
        {transcript && status === 'listening' && (
          <div className="voice-live-transcript animate-pulse">
            <Mic className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
            <span>"{transcript}"</span>
          </div>
        )}

        {/* Alerta de erro */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Visualizador de Ondas de Áudio */}
      <div className="voice-waveform-area">
        <VoiceWaveform status={status} audioLevel={audioLevel} />
      </div>

      {/* Rodapé: Microfone & Input de Texto */}
      <div className="voice-widget-footer">
        <button
          type="button"
          onClick={handleMicToggle}
          className={`voice-mic-main-btn ${status === 'listening' ? 'active' : 'inactive'}`}
          title={status === 'listening' ? 'Parar de ouvir' : 'Falar com o assistente (Voz)'}
          aria-label="Microfone"
        >
          {status === 'listening' ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        <form onSubmit={handleSubmit} className="voice-input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              status === 'listening' ? 'Escutando sua voz...' : 'Fale ou digite um comando...'
            }
            disabled={status === 'listening'}
            className="voice-text-input"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || status === 'thinking'}
            className="voice-send-btn"
            title="Enviar mensagem"
            aria-label="Enviar"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
