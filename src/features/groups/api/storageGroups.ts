import { StudyGroup, GroupMember, GroupMessage } from '@/features/core/types';

const STORAGE_KEYS = {
  GROUPS: 'focusflow_study_groups',
  MEMBERS: 'focusflow_group_members',
  MESSAGES: 'focusflow_group_messages',
};

const DEFAULT_GROUPS: StudyGroup[] = [];
const DEFAULT_MEMBERS: Record<string, GroupMember[]> = {};
const DEFAULT_MESSAGES: Record<string, GroupMessage[]> = {};

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

export const storageGroups = {
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

    // Cria o registro inicial do criador como admin do grupo
    const creatorMember: GroupMember = {
      id: `m-${Date.now()}`,
      group_id: newGroupId,
      user_name: creatorName,
      role: 'admin',
      current_status: 'idle',
      weekly_seconds: 0,
      streak_days: 1,
    };
    this.saveMembers(newGroupId, [creatorMember]);

    // Mensagem inicial de sistema
    this.sendMessage(
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

    this.sendMessage(
      groupId,
      `✏️ Informações e regras do grupo foram atualizadas pelo administrador.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return updatedGroup;
  },

  removeMember(
    groupId: string,
    memberId: string,
    removedByUserName: string = 'Admin'
  ): { success: boolean; error?: string } {
    const groups = this.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return { success: false, error: 'Grupo não encontrado.' };

    const members = this.getMembers(groupId);
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return { success: false, error: 'Membro não encontrado.' };

    // Não permite remover o criador do grupo
    if (targetMember.role === 'admin' && targetGroup.created_by && isSameUser(targetMember.user_name, targetGroup.created_by)) {
      return { success: false, error: 'Não é permitido remover o criador do grupo.' };
    }

    const remainingMembers = members.filter((m) => m.id !== memberId);
    this.saveMembers(groupId, remainingMembers);
    targetGroup.member_count = Math.max(1, (targetGroup.member_count || members.length) - 1);
    this.saveGroups(groups);

    this.sendMessage(
      groupId,
      `⚠️ ${targetMember.user_name} foi removido(a) do grupo por ${removedByUserName}.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return { success: true };
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

  joinGroup(groupId: string, userName: string = 'Você'): { success: boolean; group?: StudyGroup; error?: string } {
    const groups = this.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado.' };
    }

    const members = this.getMembers(targetGroup.id);
    const alreadyMember = members.some((m) => isSameUser(m.user_name, userName));

    if (!alreadyMember) {
      const newMember: GroupMember = {
        id: `m-${Date.now()}`,
        group_id: targetGroup.id,
        user_name: userName,
        role: 'member',
        current_status: 'idle',
        weekly_seconds: 0,
        streak_days: 1,
      };
      this.saveMembers(targetGroup.id, [...members, newMember]);
      targetGroup.member_count = (targetGroup.member_count || members.length) + 1;
      this.saveGroups(groups);
      this.sendMessage(
        targetGroup.id,
        `👋 ${userName} acabou de entrar no grupo!`,
        'FocusFlow Bot',
        'system_focus'
      );
    }

    return { success: true, group: targetGroup };
  },

  leaveGroup(groupId: string, userName: string = 'Você'): { success: boolean; error?: string } {
    const groups = this.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado.' };
    }

    const members = this.getMembers(targetGroup.id);
    const memberIndex = members.findIndex((m) => isSameUser(m.user_name, userName));

    if (memberIndex === -1) {
      return { success: false, error: 'Você não é membro deste grupo.' };
    }

    const remainingMembers = members.filter((_, idx) => idx !== memberIndex);
    this.saveMembers(targetGroup.id, remainingMembers);
    targetGroup.member_count = Math.max(0, (targetGroup.member_count || members.length) - 1);
    this.saveGroups(groups);

    this.sendMessage(
      targetGroup.id,
      `👋 ${userName} saiu do grupo.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return { success: true };
  },

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

  broadcastFocusCompleted(userName: string, taskTitle: string, minutes: number): void {
    const groups = this.getGroups();
    groups.forEach((grp) => {
      this.sendMessage(
        grp.id,
        `🔥 ${userName} completou ${minutes}m de foco em "${taskTitle}"!`,
        'FocusFlow Bot',
        'system_focus'
      );
    });
  },

  joinGroupByCode(code: string, userName: string = 'Você'): { success: boolean; group?: StudyGroup; error?: string } {
    const cleanCode = code.trim().toUpperCase();
    const groups = this.getGroups();
    const targetGroup = groups.find((g) => g.code.toUpperCase() === cleanCode);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado com este código de convite.' };
    }

    return this.joinGroup(targetGroup.id, userName);
  },

  resetGroupsData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.GROUPS);
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch {}
  },
};

export const storageGroupsService = storageGroups;
