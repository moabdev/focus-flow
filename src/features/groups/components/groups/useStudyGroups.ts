import { useState, useEffect } from 'react';
import { StudyGroup, GroupMember, GroupMessage, SupabaseProfile } from '@/features/core/types';
import { storageGroups, isSameUser, isGroupCreator } from '@/features/groups/api/storageGroups';
import { useToast } from '@/features/core/contexts/ToastContext';

export const useStudyGroups = (userProfile?: SupabaseProfile | null) => {
  const [groups, setGroups] = useState<StudyGroup[]>(() => storageGroups.getGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(() => groups[0]?.id || '');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [mobileTab, setMobileTab] = useState<'groups' | 'chat'>('chat');

  const toast = useToast();
  const currentUserName = userProfile?.full_name || 'Você';

  useEffect(() => {
    if (activeGroupId) {
      setMembers(storageGroups.getMembers(activeGroupId));
      setMessages(storageGroups.getMessages(activeGroupId));
    } else {
      setMembers([]);
      setMessages([]);
    }
  }, [activeGroupId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const isMember = activeGroup ? members.some((m) => isSameUser(m.user_name, currentUserName)) : false;
  const isCreator = activeGroup ? isGroupCreator(activeGroup, members, currentUserName) : false;

  const handleCreateGroup = (data: { name: string; description: string; category: string; avatar_icon: string; rules?: string[] }) => {
    const newGroup = storageGroups.createGroup(data, currentUserName);
    const updated = storageGroups.getGroups();
    setGroups(updated);
    setActiveGroupId(newGroup.id);
    toast.success(`Grupo "${newGroup.name}" criado com sucesso!`, 'Grupo Criado');
  };

  const handleUpdateGroup = (groupId: string, data: Partial<StudyGroup>) => {
    const updated = storageGroups.updateGroup(groupId, data);
    if (updated) {
      setGroups(storageGroups.getGroups());
      setMessages(storageGroups.getMessages(groupId));
      toast.success(`Grupo "${updated.name}" atualizado com sucesso!`, 'Grupo Atualizado');
    }
  };

  const handleJoinGroup = (code: string) => {
    const res = storageGroups.joinGroupByCode(code, currentUserName);
    if (res.success && res.group) {
      setGroups(storageGroups.getGroups());
      setActiveGroupId(res.group.id);
      toast.success(`Você entrou no grupo "${res.group.name}"!`, 'Bem-vindo(a)');
    }
    return res;
  };

  const handleJoinDirect = (groupId: string) => {
    const res = storageGroups.joinGroup(groupId, currentUserName);
    if (res.success && res.group) {
      setGroups(storageGroups.getGroups());
      setMembers(storageGroups.getMembers(groupId));
      setMessages(storageGroups.getMessages(groupId));
      toast.success(`Você entrou no grupo "${res.group.name}"!`, 'Bem-vindo(a)');
    } else {
      toast.error(res.error || 'Erro ao entrar no grupo.', 'Erro');
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    const res = storageGroups.leaveGroup(groupId, currentUserName);
    if (res.success) {
      setGroups(storageGroups.getGroups());
      setMembers(storageGroups.getMembers(groupId));
      setMessages(storageGroups.getMessages(groupId));
      toast.info(`Você saiu do grupo "${target?.name || ''}".`, 'Grupo');
    } else {
      toast.error(res.error || 'Erro ao sair do grupo.', 'Erro');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    storageGroups.deleteGroup(groupId);
    const updated = storageGroups.getGroups();
    setGroups(updated);
    if (activeGroupId === groupId) {
      setActiveGroupId(updated[0]?.id || '');
    }
    toast.success(`Grupo "${target?.name || ''}" foi excluído.`, 'Grupo Excluído');
  };

  const handleConfirmRemoveMember = () => {
    if (!activeGroupId || !memberToRemove) return;
    const res = storageGroups.removeMember(activeGroupId, memberToRemove.id, currentUserName);
    if (res.success) {
      setGroups(storageGroups.getGroups());
      setMembers(storageGroups.getMembers(activeGroupId));
      setMessages(storageGroups.getMessages(activeGroupId));
      toast.success(`${memberToRemove.user_name} foi removido(a) do grupo.`, 'Membro Removido');
    } else {
      toast.error(res.error || 'Erro ao remover membro.', 'Erro');
    }
    setMemberToRemove(null);
  };

  const handleSendMessage = (text: string) => {
    if (!activeGroupId) return;
    storageGroups.sendMessage(activeGroupId, text, currentUserName);
    setMessages(storageGroups.getMessages(activeGroupId));
  };

  const categories = ['Todas', ...Array.from(new Set(groups.map((g) => g.category)))];

  const filteredGroups = groups.filter((g) => {
    const matchesCategory = selectedCategory === 'Todas' || g.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
  });

  const getGroupFocusCount = (groupId: string) => {
    const gMembers = storageGroups.getMembers(groupId);
    return gMembers.filter((m) => m.current_status === 'focusing').length;
  };

  return {
    groups,
    activeGroup,
    activeGroupId,
    setActiveGroupId,
    members,
    messages,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isJoinModalOpen,
    setIsJoinModalOpen,
    isMembersModalOpen,
    setIsMembersModalOpen,
    memberToRemove,
    setMemberToRemove,
    selectedCategory,
    setSelectedCategory,
    mobileTab,
    setMobileTab,
    currentUserName,
    isMember,
    isCreator,
    categories,
    filteredGroups,
    getGroupFocusCount,
    handleCreateGroup,
    handleUpdateGroup,
    handleJoinGroup,
    handleJoinDirect,
    handleLeaveGroup,
    handleDeleteGroup,
    handleConfirmRemoveMember,
    handleSendMessage,
  };
};
