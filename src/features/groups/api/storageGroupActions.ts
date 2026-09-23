import { StudyGroup, GroupMember } from '@/features/core/types';
import { storageGroupMembers, isSameUser } from './storageGroupMembers';
import { storageGroupMessages } from './storageGroupMessages';
import { storageGroupCore } from './storageGroupCore';

export const storageGroupActions = {
  removeMember(
    groupId: string,
    memberId: string,
    removedByUserName: string = 'Admin'
  ): { success: boolean; error?: string } {
    const groups = storageGroupCore.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return { success: false, error: 'Grupo não encontrado.' };

    const members = storageGroupMembers.getMembers(groupId);
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return { success: false, error: 'Membro não encontrado.' };

    if (targetMember.role === 'admin' && targetGroup.created_by && isSameUser(targetMember.user_name, targetGroup.created_by)) {
      return { success: false, error: 'Não é permitido remover o criador do grupo.' };
    }

    const remainingMembers = members.filter((m) => m.id !== memberId);
    storageGroupMembers.saveMembers(groupId, remainingMembers);
    targetGroup.member_count = Math.max(1, (targetGroup.member_count || members.length) - 1);
    storageGroupCore.saveGroups(groups);

    storageGroupMessages.sendMessage(
      groupId,
      `⚠️ ${targetMember.user_name} foi removido(a) do grupo por ${removedByUserName}.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return { success: true };
  },

  joinGroup(groupId: string, userName: string = 'Você'): { success: boolean; group?: StudyGroup; error?: string } {
    const groups = storageGroupCore.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado.' };
    }

    const members = storageGroupMembers.getMembers(targetGroup.id);
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
      storageGroupMembers.saveMembers(targetGroup.id, [...members, newMember]);
      targetGroup.member_count = (targetGroup.member_count || members.length) + 1;
      storageGroupCore.saveGroups(groups);
      storageGroupMessages.sendMessage(
        targetGroup.id,
        `👋 ${userName} acabou de entrar no grupo!`,
        'FocusFlow Bot',
        'system_focus'
      );
    }

    return { success: true, group: targetGroup };
  },

  leaveGroup(groupId: string, userName: string = 'Você'): { success: boolean; error?: string } {
    const groups = storageGroupCore.getGroups();
    const targetGroup = groups.find((g) => g.id === groupId);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado.' };
    }

    const members = storageGroupMembers.getMembers(targetGroup.id);
    const memberIndex = members.findIndex((m) => isSameUser(m.user_name, userName));

    if (memberIndex === -1) {
      return { success: false, error: 'Você não é membro deste grupo.' };
    }

    const remainingMembers = members.filter((_, idx) => idx !== memberIndex);
    storageGroupMembers.saveMembers(targetGroup.id, remainingMembers);
    targetGroup.member_count = Math.max(0, (targetGroup.member_count || members.length) - 1);
    storageGroupCore.saveGroups(groups);

    storageGroupMessages.sendMessage(
      targetGroup.id,
      `👋 ${userName} saiu do grupo.`,
      'FocusFlow Bot',
      'system_focus'
    );

    return { success: true };
  },

  broadcastFocusCompleted(userName: string, taskTitle: string, minutes: number): void {
    const groups = storageGroupCore.getGroups();
    groups.forEach((grp) => {
      storageGroupMessages.sendMessage(
        grp.id,
        `🔥 ${userName} completou ${minutes}m de foco em "${taskTitle}"!`,
        'FocusFlow Bot',
        'system_focus'
      );
    });
  },

  joinGroupByCode(code: string, userName: string = 'Você'): { success: boolean; group?: StudyGroup; error?: string } {
    const cleanCode = code.trim().toUpperCase();
    const groups = storageGroupCore.getGroups();
    const targetGroup = groups.find((g) => g.code.toUpperCase() === cleanCode);

    if (!targetGroup) {
      return { success: false, error: 'Grupo não encontrado com este código de convite.' };
    }

    return this.joinGroup(targetGroup.id, userName);
  },
};
