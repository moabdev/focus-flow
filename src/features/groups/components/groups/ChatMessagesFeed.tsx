import React, { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GroupMessage, StudyGroup } from '@/features/core/types';

interface ChatMessagesFeedProps {
  group: StudyGroup;
  messages: GroupMessage[];
  formatTime: (isoString: string) => string;
}

export const ChatMessagesFeed: React.FC<ChatMessagesFeedProps> = ({ group, messages, formatTime }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="group-messages-feed">
      {messages.length === 0 && (
        <div className="empty-chat-state">
          <span className="empty-chat-icon">{group.avatar_icon}</span>
          <h4>Bem-vindo(a) ao #{group.name}</h4>
          <p>Seja o primeiro a enviar uma mensagem ou envie uma reação rápida abaixo para quebrar o gelo!</p>
        </div>
      )}

      {messages.map((msg) => {
        if (msg.type === 'system_focus') {
          return (
            <div key={msg.id} className="system-focus-message">
              <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {msg.text}
            </div>
          );
        }

        const isMe = msg.user_name === 'Você';

        return (
          <div key={msg.id} className={`chat-message-row ${isMe ? 'me' : ''}`}>
            <div className="chat-avatar">{msg.user_name.charAt(0)}</div>
            <div>
              <div className="chat-meta">
                <span>{msg.user_name}</span>
                <span>{formatTime(msg.created_at)}</span>
              </div>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
