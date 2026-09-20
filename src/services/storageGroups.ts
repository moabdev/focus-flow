import { StudyGroup, GroupMember, GroupMessage } from '../types';

const STORAGE_KEYS = {
  GROUPS: 'focusflow_study_groups',
  MEMBERS: 'focusflow_group_members',
  MESSAGES: 'focusflow_group_messages',
};

const DEFAULT_GROUPS: StudyGroup[] = [
  {
    id: 'grp-devs',
    name: 'Devs & Engenharia de Software',
    description: 'Comunidade de desenvolvedores focados em código limpo, algoritmos e projetos.',
    category: 'Tecnologia',
    avatar_icon: '💻',
    code: 'DEV-2026',
    member_count: 8,
    created_at: '2026-01-10T10:00:00Z',
    created_by: 'Lucas Code',
    rules: [
      'Manter foco absoluto nos blocos de Pomodoro',
      'Compartilhar apenas dúvidas e artigos de engenharia/código',
      'Sem conversas paralelas ou desrespeito',
      'Registrar tarefas ativas no Pomodoro para acompanhar o time',
    ],
  },
  {
    id: 'grp-concursos',
    name: 'Concursos Públicos & OAB',
    description: 'Foco diário em questões comentadas, doutrina, jurisprudência e simulados.',
    category: 'Direito & Concursos',
    avatar_icon: '⚖️',
    code: 'OAB-100',
    member_count: 12,
    created_at: '2026-01-15T14:30:00Z',
    created_by: 'Renata Delegada',
    rules: [
      'Resolução mínima de 20 questões por dia',
      'Debater gabaritos de forma respeitosa e fundamentada',
      'Sem propagandas ou links externos suspeitos',
      'Comemorar aprovações e apoiar colegas em ciclos difíceis',
    ],
  },
  {
    id: 'grp-medicina',
    name: 'Medicina & Residência',
    description: 'Estudos intensivos de internato, casos clínicos e preparação para provas de residência.',
    category: 'Saúde & Medicina',
    avatar_icon: '🩺',
    code: 'MED-PRO',
    member_count: 6,
    created_at: '2026-02-01T08:00:00Z',
    created_by: 'Dra. Beatriz',
    rules: [
      'Sigilo e respeito à ética médica em discussões de casos',
      'Foco em estudos de internato e questões de residência',
      'Pontualidade nas sessões de estudo em grupo',
      'Compartilhar resumos e flashcards úteis',
    ],
  },
];

const DEFAULT_MEMBERS: Record<string, GroupMember[]> = {
  'grp-devs': [
    {
      id: 'm-1',
      group_id: 'grp-devs',
      user_name: 'Lucas Code',
      role: 'admin',
      current_status: 'focusing',
      current_task_title: 'Refatoração da API REST em Go',
      weekly_seconds: 48600, // 13.5h
      streak_days: 14,
    },
    {
      id: 'm-2',
      group_id: 'grp-devs',
      user_name: 'Marina Tech',
      role: 'member',
      current_status: 'focusing',
      current_task_title: 'Estruturas de Dados: Árvores AVL',
      weekly_seconds: 43200, // 12h
      streak_days: 8,
    },
    {
      id: 'm-3',
      group_id: 'grp-devs',
      user_name: 'Gabriel DevOps',
      role: 'member',
      current_status: 'break',
      weekly_seconds: 28800, // 8h
      streak_days: 5,
    },
    {
      id: 'm-4',
      group_id: 'grp-devs',
      user_name: 'Você (FocusFlow)',
      role: 'member',
      current_status: 'idle',
      weekly_seconds: 21600, // 6h
      streak_days: 3,
    },
  ],
  'grp-concursos': [
    {
      id: 'm-5',
      group_id: 'grp-concursos',
      user_name: 'Renata Delegada',
      role: 'admin',
      current_status: 'focusing',
      current_task_title: 'Direito Penal - Teoria do Delito',
      weekly_seconds: 57600, // 16h
      streak_days: 21,
    },
    {
      id: 'm-6',
      group_id: 'grp-concursos',
      user_name: 'Carlos OAB',
      role: 'member',
      current_status: 'focusing',
      current_task_title: 'Ética Profissional e Prerrogativas',
      weekly_seconds: 36000, // 10h
      streak_days: 7,
    },
  ],
  'grp-medicina': [
    {
      id: 'm-7',
      group_id: 'grp-medicina',
      user_name: 'Dra. Beatriz',
      role: 'admin',
      current_status: 'focusing',
      current_task_title: 'Cardiologia - Arritmias no ECG',
      weekly_seconds: 50400, // 14h
      streak_days: 19,
    },
  ],
};

const DEFAULT_MESSAGES: Record<string, GroupMessage[]> = {
  'grp-devs': [
    {
      id: 'msg-1',
      group_id: 'grp-devs',
      user_id: 'm-1',
      user_name: 'Lucas Code',
      text: 'Bom dia time! Hoje a meta são 8 ciclos de Pomodoro.',
      type: 'chat',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'msg-2',
      group_id: 'grp-devs',
      user_id: 'm-2',
      user_name: 'Marina Tech',
      text: 'Bora! Começando agora estudo de algoritmos.',
      type: 'chat',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-3',
      group_id: 'grp-devs',
      user_id: 'system',
      user_name: 'FocusFlow Bot',
      text: '⚡ Marina Tech completou 25m de foco em "Estruturas de Dados"!',
      type: 'system_focus',
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
  ],
};

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
