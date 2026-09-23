import { GroupMessage } from '@/features/core/types';
import { STORAGE_KEYS } from './storageGroupMembers';

const DEFAULT_MESSAGES: Record<string, GroupMessage[]> = {};

export const storageGroupMessages = {
  getMessages(groupId: string): GroupMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MESSAGES}_${groupId}`);
      if (data) return JSON.parse(data);
      return DEFAULT_MESSAGES[groupId] || [];
    } catch {
      return DEFAULT_MESSAGES[groupId] || [];
    }
  },

  sendMessage(
    groupId: string,
    text: string,
    userName: string = 'Você',
    type: 'chat' | 'system_focus' = 'chat'
  ): GroupMessage {
    const messages = this.getMessages(groupId);
    const newMessage: GroupMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      group_id: groupId,
      user_id: userName === 'Você' ? 'current-user' : 'user-peer',
      user_name: userName,
      text,
      type,
      created_at: new Date().toISOString(),
    };
    const updated = [...messages, newMessage];
    try {
      localStorage.setItem(`${STORAGE_KEYS.MESSAGES}_${groupId}`, JSON.stringify(updated));
    } catch {}
    return newMessage;
  },
};
