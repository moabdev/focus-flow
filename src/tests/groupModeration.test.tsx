import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupChatPanel } from '../components/groups/GroupChatPanel';
import { StudyGroupsView } from '../components/groups/StudyGroupsView';
import { ToastProvider } from '../context/ToastContext';
import { storageGroupsService } from '../services/storageGroups';
import { StudyGroup, GroupMessage, GroupMember } from '../types';

describe('Moderação de Grupos: Regras, Admin, Convite por E-mail, Edição e Remoção de Membros', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockGroup: StudyGroup = {
    id: 'grp-mod-1',
    name: 'Grupo de Concurso Fiscal',
    description: 'Preparação para Auditor Fiscal da Receita Federal',
    category: 'Direito & Concursos',
    avatar_icon: '⚖️',
    code: 'AUDITOR-2026',
    member_count: 3,
    created_at: '2026-09-01T10:00:00Z',
    created_by: 'Você',
    rules: [
      'Resolver mínimo de 30 questões de TI e Direito por dia',
      'Manter ética e respeito com os colegas',
      'Registrar os ciclos de Pomodoro com a matéria estudada',
    ],
  };

  const mockMembers: GroupMember[] = [
    {
      id: 'm-admin',
      group_id: 'grp-mod-1',
      user_name: 'Você',
      role: 'admin',
      current_status: 'focusing',
      weekly_seconds: 54000,
      streak_days: 15,
    },
    {
      id: 'm-member-1',
      group_id: 'grp-mod-1',
      user_name: 'Carlos Concurseiro',
      role: 'member',
      current_status: 'idle',
      weekly_seconds: 36000,
      streak_days: 7,
    },
  ];

  const mockMessages: GroupMessage[] = [
    {
      id: 'msg-1',
      group_id: 'grp-mod-1',
      user_id: 'u-1',
      user_name: 'Carlos Concurseiro',
      text: 'Alguém estudando Legislação Aduaneira hoje?',
      type: 'chat',
      created_at: '2026-09-20T10:00:00Z',
    },
  ];

  it('deve abrir o modal de Regras do Grupo e listar todas as regras configuradas', () => {
    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={true}
          isAdmin={true}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
          onUpdateGroup={vi.fn()}
        />
      </ToastProvider>
    );

    // Botão de regras no cabeçalho
    const rulesBtn = screen.getByRole('button', { name: /Regras/i });
    expect(rulesBtn).toBeInTheDocument();

    fireEvent.click(rulesBtn);

    // Modal de Regras abre
    expect(screen.getByText(/Regras da Sala #Grupo de Concurso Fiscal/i)).toBeInTheDocument();
    expect(screen.getByText('Resolver mínimo de 30 questões de TI e Direito por dia')).toBeInTheDocument();
    expect(screen.getByText('Manter ética e respeito com os colegas')).toBeInTheDocument();

    // Fecha o modal
    const closeBtn = screen.getByRole('button', { name: /Entendido/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Regras da Sala #Grupo de Concurso Fiscal/i)).not.toBeInTheDocument();
  });

  it('deve abrir o modal de Convite por E-mail e gerar link mailto com dados do grupo', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={true}
          isAdmin={true}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
          onUpdateGroup={vi.fn()}
        />
      </ToastProvider>
    );

    const emailBtn = screen.getByRole('button', { name: /E-mail/i });
    fireEvent.click(emailBtn);

    // Modal de convite por email abre
    expect(screen.getByRole('heading', { name: 'Enviar Convite por E-mail' })).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/E-mail do Destinatário/i);
    fireEvent.change(emailInput, { target: { value: 'amigo@concursos.com' } });

    const submitBtn = screen.getByRole('button', { name: /abrir no cliente de e-mail/i });
    fireEvent.click(submitBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:amigo%40concursos.com'),
      '_blank'
    );

    windowOpenSpy.mockRestore();
  });

  it('deve abrir o modal de Edição de Grupo quando o admin clica em Editar Grupo e chamar onUpdateGroup', () => {
    const onUpdateGroup = vi.fn();

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={true}
          isAdmin={true}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
          onUpdateGroup={onUpdateGroup}
        />
      </ToastProvider>
    );

    const editBtn = screen.getByRole('button', { name: /Editar Grupo/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Editar Grupo de Estudo' })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nome do Grupo/i);
    fireEvent.change(nameInput, { target: { value: 'Grupo Fiscal & TCU' } });

    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(saveBtn);

    expect(onUpdateGroup).toHaveBeenCalledWith(
      'grp-mod-1',
      expect.objectContaining({
        name: 'Grupo Fiscal & TCU',
      })
    );
  });

  it('deve atualizar grupo e remover membros com sucesso via storageGroupsService', () => {
    // 1. Cria grupo com regras
    const created = storageGroupsService.createGroup(
      {
        name: 'Clube de Medicina',
        description: 'Internato e Residência',
        category: 'Saúde & Medicina',
        avatar_icon: '🩺',
        rules: ['Estudo diário', 'Respeito aos colegas'],
      },
      'Dra. Mariana'
    );

    expect(created.rules).toHaveLength(2);
    expect(created.created_by).toBe('Dra. Mariana');

    // 2. Adiciona membro
    storageGroupsService.joinGroup(created.id, 'Residente Pedro');
    const membersWithPedro = storageGroupsService.getMembers(created.id);
    expect(membersWithPedro).toHaveLength(2);

    // 3. Edita grupo
    const updated = storageGroupsService.updateGroup(created.id, {
      name: 'Clube de Medicina Avançada',
      rules: ['Nova regra 1', 'Nova regra 2', 'Nova regra 3'],
    });

    expect(updated?.name).toBe('Clube de Medicina Avançada');
    expect(updated?.rules).toHaveLength(3);

    // 4. Remove membro Pedro pelo admin
    const pedroMember = membersWithPedro.find((m) => m.user_name === 'Residente Pedro')!;
    const removeRes = storageGroupsService.removeMember(created.id, pedroMember.id, 'Dra. Mariana');
    expect(removeRes.success).toBe(true);

    const membersAfterRemove = storageGroupsService.getMembers(created.id);
    expect(membersAfterRemove).toHaveLength(1);
    expect(membersAfterRemove.find((m) => m.id === pedroMember.id)).toBeUndefined();

    // 5. Verifica se mensagem do bot foi gerada
    const messages = storageGroupsService.getMessages(created.id);
    expect(messages.some((m) => m.text.includes('foi removido(a) do grupo por Dra. Mariana'))).toBe(true);

    // 6. Tentar remover o criador do grupo deve ser bloqueado
    const adminMember = membersAfterRemove[0];
    const removeAdminRes = storageGroupsService.removeMember(created.id, adminMember.id, 'Outro');
    expect(removeAdminRes.success).toBe(false);
    expect(removeAdminRes.error).toContain('criador do grupo');
  });

  it('deve exibir o criador como Admin na interface do StudyGroupsView', () => {
    // Inicializa storage com um grupo criado por "Você"
    storageGroupsService.createGroup(
      {
        name: 'Grupo Criado Teste',
        description: 'Descrição de teste',
        category: 'Tecnologia',
        avatar_icon: '💻',
      },
      'Você'
    );

    render(
      <ToastProvider>
        <StudyGroupsView userProfile={{ id: 'u1', full_name: 'Você' }} />
      </ToastProvider>
    );

    // Verifica que o badge de Admin é exibido nos grupos onde o usuário é criador
    const adminBadges = screen.getAllByText(/Admin/i);
    expect(adminBadges.length).toBeGreaterThanOrEqual(1);
  });
});
