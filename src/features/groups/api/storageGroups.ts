import { storageGroupMembers, isSameUser, isGroupCreator, isGroupAdmin } from './storageGroupMembers';
import { storageGroupMessages } from './storageGroupMessages';
import { storageGroupCore } from './storageGroupCore';
import { storageGroupActions } from './storageGroupActions';

export { isSameUser, isGroupCreator, isGroupAdmin };

export const storageGroups = {
  ...storageGroupCore,
  ...storageGroupActions,

  getMembers(groupId: string) {
    return storageGroupMembers.getMembers(groupId);
  },

  saveMembers(groupId: string, members: any[]): void {
    storageGroupMembers.saveMembers(groupId, members);
  },

  getMessages(groupId: string) {
    return storageGroupMessages.getMessages(groupId);
  },

  sendMessage(
    groupId: string,
    text: string,
    userName: string = 'Você',
    type: 'chat' | 'system_focus' = 'chat'
  ) {
    return storageGroupMessages.sendMessage(groupId, text, userName, type);
  },
};

export const storageGroupsService = storageGroups;
