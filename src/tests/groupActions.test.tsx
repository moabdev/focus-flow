import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupChatPanel } from '../components/groups/GroupChatPanel';
import { ToastProvider } from '../context/ToastContext';
import { storageGroupsService } from '../services/storageGroups';
import { StudyGroup, GroupMessage, GroupMember } from '../types';

describe('Ações de Grupos de Estudos (Chat, Convites, Saída e Exclusão com Modal)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockGroup: StudyGroup = {
    id: 'grp-test-1',
    name: 'Concurseiros Foco Total',
    description: 'Sala focada em direito constitucional e administrativo',
    category: 'Direito',
    avatar_icon: '⚖️',
    code: 'FOCO2026',
    member_count: 5,
    created_at: '2026-09-01T10:00:00Z',
  };

  const mockMembers: GroupMember[] = [
    {
      id: 'm-1',
      group_id: 'grp-test-1',
      user_name: 'Dra. Ana',
      role: 'admin',
      current_status: 'focusing',
      weekly_seconds: 480 * 60,
      streak_days: 12,
    },
    {
      id: 'm-2',
      group_id: 'grp-test-1',
      user_name: 'Lucas Estudante',
      role: 'member',
      current_status: 'idle',
      weekly_seconds: 240 * 60,
      streak_days: 5,
    },
  ];

  const mockMessages: GroupMessage[] = [
    {
      id: 'msg-1',
      group_id: 'grp-test-1',
      user_id: 'u-ana',
      user_name: 'Dra. Ana',
      text: 'Bom dia pessoal! Começando bloco de 50 minutos agora.',
      type: 'chat',
      created_at: '2026-09-20T08:00:00Z',
    },
  ];

  it('deve renderizar o chat do grupo com título, contagem de membros e mensagens existentes', () => {
    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={false}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Concurseiros Foco Total')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // member count
    expect(screen.getByText(/Bom dia pessoal/i)).toBeInTheDocument();
    expect(screen.getByText('Dra. Ana')).toBeInTheDocument();
  });

  it('deve enviar uma mensagem personalizada via formulário de chat', () => {
    const onSendMessage = vi.fn();

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={false}
          onSendMessage={onSendMessage}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
        />
      </ToastProvider>
    );

    const input = screen.getByPlaceholderText(/Conversar em #Concurseiros Foco Total.../i);
    fireEvent.change(input, { target: { value: 'Bora focar juntos!' } });

    const sendBtn = screen.getByRole('button', { name: '' }); // Send icon button inside form
    fireEvent.submit(input.closest('form')!);

    expect(onSendMessage).toHaveBeenCalledWith('Bora focar juntos!');
  });

  it('deve enviar mensagem de incentivo rápido ao clicar no chip predefinido', () => {
    const onSendMessage = vi.fn();

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={false}
          onSendMessage={onSendMessage}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
        />
      </ToastProvider>
    );

    const quickCheerBtn = screen.getByText('🔥 Foco total!');
    fireEvent.click(quickCheerBtn);

    expect(onSendMessage).toHaveBeenCalledWith('🔥 Foco total!');
  });

  it('deve abrir ConfirmModal de perigo quando o criador clica em Excluir Grupo e chamar onDeleteGroup após confirmação', () => {
    const onDeleteGroup = vi.fn();
    const windowConfirmSpy = vi.spyOn(window, 'confirm');

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={true}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={onDeleteGroup}
        />
      </ToastProvider>
    );

    // Clica no botão Excluir Grupo
    const deleteGroupBtn = screen.getByRole('button', { name: /Excluir Grupo/i });
    fireEvent.click(deleteGroupBtn);

    // Modal customizado abre
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir Grupo de Estudos' })).toBeInTheDocument();
    expect(windowConfirmSpy).not.toHaveBeenCalled();

    // Clica em Cancelar
    fireEvent.click(screen.getByTestId('confirm-modal-cancel'));
    expect(onDeleteGroup).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

    // Reabre e confirma
    fireEvent.click(deleteGroupBtn);
    fireEvent.click(screen.getByTestId('confirm-modal-confirm'));
    expect(onDeleteGroup).toHaveBeenCalledWith('grp-test-1');

    windowConfirmSpy.mockRestore();
  });

  it('deve abrir ConfirmModal de aviso quando um membro clica em Sair e chamar onLeaveGroup após confirmação', () => {
    const onLeaveGroup = vi.fn();
    const windowConfirmSpy = vi.spyOn(window, 'confirm');

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={true}
          isCreator={false}
          onSendMessage={vi.fn()}
          onJoinGroup={vi.fn()}
          onLeaveGroup={onLeaveGroup}
          onDeleteGroup={vi.fn()}
        />
      </ToastProvider>
    );

    // Clica no botão Sair
    const leaveBtn = screen.getByRole('button', { name: /Sair/i });
    fireEvent.click(leaveBtn);

    // Modal customizado abre com título "Sair do Grupo"
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sair do Grupo' })).toBeInTheDocument();
    expect(windowConfirmSpy).not.toHaveBeenCalled();

    // Clica em Permanecer
    fireEvent.click(screen.getByTestId('confirm-modal-cancel'));
    expect(onLeaveGroup).not.toHaveBeenCalled();

    // Reabre e confirma saída
    fireEvent.click(leaveBtn);
    fireEvent.click(screen.getByTestId('confirm-modal-confirm'));
    expect(onLeaveGroup).toHaveBeenCalledWith('grp-test-1');

    windowConfirmSpy.mockRestore();
  });

  it('deve permitir entrar no grupo se o usuário ainda não for membro', () => {
    const onJoinGroup = vi.fn();

    render(
      <ToastProvider>
        <GroupChatPanel
          group={mockGroup}
          messages={mockMessages}
          members={mockMembers}
          isMember={false}
          isCreator={false}
          onSendMessage={vi.fn()}
          onJoinGroup={onJoinGroup}
          onLeaveGroup={vi.fn()}
          onDeleteGroup={vi.fn()}
        />
      </ToastProvider>
    );

    // Banner de não-membro visível
    expect(screen.getByText('Você não participa deste grupo')).toBeInTheDocument();

    const joinBtn = screen.getByRole('button', { name: /Entrar no Grupo/i });
    fireEvent.click(joinBtn);

    expect(onJoinGroup).toHaveBeenCalledWith('grp-test-1');
  });

  it('deve criar, entrar, sair e excluir grupo através do storageGroupsService', () => {
    // Cria grupo
    const created = storageGroupsService.createGroup({
      name: 'Grupo Algoritmos',
      description: 'LeetCode e estruturas de dados',
      category: 'Computação',
      avatar_icon: '💻',
    }, 'Dev Creator');

    expect(created.name).toBe('Grupo Algoritmos');
    expect(created.code).toBeDefined();

    // Adiciona novo membro
    const joined = storageGroupsService.joinGroup(created.id, 'Dev Bob');
    expect(joined.success).toBe(true);

    const membersAfterJoin = storageGroupsService.getMembers(created.id);
    expect(membersAfterJoin.length).toBe(2);

    // Membro sai do grupo
    const leaveRes = storageGroupsService.leaveGroup(created.id, 'Dev Bob');
    expect(leaveRes.success).toBe(true);

    const membersAfterLeave = storageGroupsService.getMembers(created.id);
    expect(membersAfterLeave.length).toBe(1);

    // Criador exclui o grupo
    const deleteRes = storageGroupsService.deleteGroup(created.id);
    expect(deleteRes).toBe(true);

    const allGroups = storageGroupsService.getGroups();
    expect(allGroups.find((g) => g.id === created.id)).toBeUndefined();
  });
});
