import { GroupMember, StudyGroup } from '@/features/core/types';

export const STORAGE_KEYS = {
  GROUPS: 'focusflow_study_groups',
  MEMBERS: 'focusflow_group_members',
  MESSAGES: 'focusflow_group_messages',
};

const DEFAULT_MEMBERS: Record<string, GroupMember[]> = {};

export const isSameUser = (nameA?: string, nameB?: string): boolean => {
  if (!nameA || !nameB) return false;
  const a = nameA.trim().toLowerCase();
  const b = nameB.trim().toLowerCase();
  if (a === b) return true;
  if (a.startsWith('você') && b.startsWith('você')) return true;
  if ((a === 'você' || a.startsWith('você')) && b === 'você') return true;
  if (a === 'você' && (b === 'você' || b.startsWith('você'))) return true;
  return false;
};

export const isGroupCreator = (group: StudyGroup, members: GroupMember[], userName: string = 'Você'): boolean => {
  if (group.created_by && isSameUser(group.created_by, userName)) {
    return true;
  }
  const userMember = members.find((m) => isSameUser(m.user_name, userName));
  return userMember?.role === 'admin';
};

export const isGroupAdmin = isGroupCreator;

export const storageGroupMembers = {
  getMembers(groupId: string): GroupMember[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.MEMBERS}_${groupId}`);
      if (data) return JSON.parse(data);
      return DEFAULT_MEMBERS[groupId] || [
        {
          id: `m-${Date.now()}`,
          group_id: groupId,
          user_name: 'Você',
          role: 'admin',
          current_status: 'idle',
          weekly_seconds: 0,
          streak_days: 1,
        },
      ];
    } catch {
      return DEFAULT_MEMBERS[groupId] || [];
    }
  },

  saveMembers(groupId: string, members: GroupMember[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.MEMBERS}_${groupId}`, JSON.stringify(members));
    } catch {}
  },
};
