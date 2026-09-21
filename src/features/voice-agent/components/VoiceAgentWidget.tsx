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
  CheckCircle,
  Clock,
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

  return (
    <div className="voice-widget-card" role="dialog" aria-label="Flow Voice Copilot">
      {/* Header */}
      <div className="voice-widget-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
              Flow Copilot
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-normal">
                Voz & IA
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">Assistente de foco por voz</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-200 transition-colors ${
              isMuted ? 'text-rose-400 bg-rose-500/10' : 'hover:bg-white/5'
            }`}
            title={isMuted ? 'Desmutar voz do assistente' : 'Mutar voz do assistente'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClearHistory}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors ml-1"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div className="voice-widget-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`voice-bubble ${msg.role}`}>
            <div>{msg.content}</div>

            {/* Ação executada pelo agente */}
            {msg.actionSummary && (
              <div className="voice-bubble-action">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                <span>{msg.actionSummary}</span>
              </div>
            )}

            <div className="text-[10px] opacity-60 text-right mt-1 flex items-center justify-end gap-1">
              <Clock className="w-2.5 h-2.5" />
              {msg.timestamp}
            </div>
          </div>
        ))}

        {/* Transcrição ao vivo */}
        {transcript && status === 'listening' && (
          <div className="voice-bubble user opacity-80 animate-pulse border border-dashed border-white/40">
            <span className="text-xs italic">Ouvindo: "{transcript}"</span>
          </div>
        )}

        {/* Erro */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            ⚠️ {errorMessage}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Visualizador de Ondas de Áudio */}
      <div className="voice-waveform-area">
        <VoiceWaveform status={status} audioLevel={audioLevel} />
      </div>

      {/* Rodapé: Controles de Voz & Input de Texto */}
      <div className="voice-widget-footer">
        <button
          type="button"
          onClick={handleMicToggle}
          className={`voice-mic-main-btn ${status === 'listening' ? 'active' : 'inactive'}`}
          title={status === 'listening' ? 'Parar de ouvir' : 'Falar com o assistente'}
        >
          {status === 'listening' ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1.5 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              status === 'listening' ? 'Escutando sua voz...' : 'Digite ou use a voz...'
            }
            disabled={status === 'listening'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || status === 'thinking'}
            className="absolute right-1.5 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:pointer-events-none text-white transition-all shadow-sm"
            title="Enviar mensagem"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
