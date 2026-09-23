import { StudyGroup, GroupMember } from '@/features/core/types';
import { storageGroupMembers, STORAGE_KEYS } from './storageGroupMembers';
import { storageGroupMessages } from './storageGroupMessages';

const DEFAULT_GROUPS: StudyGroup[] = [];

export const storageGroupCore = {
  getGroups(): StudyGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
      return data ? JSON.parse(data) : DEFAULT_GROUPS;
    } catch {
      return DEFAULT_GROUPS;
    }
  },

  saveGroups(groups: StudyGroup[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    } catch {}
  },

  createGroup(
    data: {
      name: string;
      description: string;
      category: string;
      avatar_icon: string;
      rules?: string[];
    },
    creatorName: string = 'Você'
  ): StudyGroup {
    const groups = this.getGroups();
    const newGroupId = `grp-${Date.now()}`;
    const newGroup: StudyGroup = {
      id: newGroupId,
      name: data.name,
      description: data.description,
      category: data.category,
      avatar_icon: data.avatar_icon || '🎯',
      code: `GRP-${Math.floor(1000 + Math.random() * 9000)}`,
      member_count: 1,
      created_at: new Date().toISOString(),
      created_by: creatorName,
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        'Manter o foco e dedicação nas metas diárias de estudo',
        'Respeitar todos os colegas e apoiar dúvidas com empatia',
        'Sem conversas fora do propósito do grupo de estudos',
        'Registrar subtarefas no Pomodoro para inspirar a comunidade',
      ],
    };
    const updated = [newGroup, ...groups];
    this.saveGroups(updated);

    const creatorMember: GroupMember = {
      id: `m-${Date.now()}`,
      group_id: newGroupId,
      user_name: creatorName,
      role: 'admin',
      current_status: 'idle',
      weekly_seconds: 0,
      streak_days: 1,
    };
    storageGroupMembers.saveMembers(newGroupId, [creatorMember]);

    storageGroupMessages.sendMessage(
      newGroupId,
      `🎉 ${creatorName} criou o grupo "${newGroup.name}"! Compartilhe o código ${newGroup.code} para convidar amigos.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return newGroup;
  },

  updateGroup(groupId: string, data: Partial<StudyGroup>): StudyGroup | null {
    const groups = this.getGroups();
    const index = groups.findIndex((g) => g.id === groupId);
    if (index === -1) return null;

    const existing = groups[index];
    const updatedGroup: StudyGroup = {
      ...existing,
      ...data,
      id: existing.id,
      code: existing.code,
      created_at: existing.created_at,
      created_by: existing.created_by,
      member_count: existing.member_count,
    };

    groups[index] = updatedGroup;
    this.saveGroups(groups);

    storageGroupMessages.sendMessage(
      groupId,
      `✏️ Informações e regras do grupo foram atualizadas pelo administrador.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return updatedGroup;
  },

  deleteGroup(groupId: string): boolean {
    const groups = this.getGroups();
    const updated = groups.filter((g) => g.id !== groupId);
    this.saveGroups(updated);
    try {
      localStorage.removeItem(`${STORAGE_KEYS.MEMBERS}_${groupId}`);
      localStorage.removeItem(`${STORAGE_KEYS.MESSAGES}_${groupId}`);
    } catch {}
    return true;
  },

  resetGroupsData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GROUPS);
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch {}
  },
};
