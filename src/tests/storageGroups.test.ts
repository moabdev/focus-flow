import { describe, it, expect, beforeEach } from 'vitest';
import { storageGroups } from '../services/storageGroups';

describe('Grupos de Estudo & Chat ao Vivo (storageGroups)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve retornar grupos padrão pré-semeados', () => {
    const groups = storageGroups.getGroups();
    expect(groups.length).toBeGreaterThanOrEqual(3);
    const names = groups.map((g) => g.name);
    expect(names).toContain('Devs & Engenharia de Software');
    expect(names).toContain('Concursos Públicos & OAB');
    expect(names).toContain('Medicina & Residência');
  });

  it('deve permitir a criação de um novo grupo de estudos', () => {
    const newGroup = storageGroups.createGroup({
      name: 'Mestrado em IA',
      description: 'Grupo focado em pesquisa e teses de pós-graduação',
      category: 'Acadêmico',
      avatar_icon: '🎓',
    });

    expect(newGroup.id).toBeDefined();
    expect(newGroup.name).toBe('Mestrado em IA');
    expect(newGroup.code).toBeDefined();

    const allGroups = storageGroups.getGroups();
    expect(allGroups.some((g) => g.id === newGroup.id)).toBe(true);
  });

  it('deve recuperar a lista de membros de um grupo', () => {
    const groups = storageGroups.getGroups();
    const firstGroup = groups[0];
    const members = storageGroups.getMembers(firstGroup.id);

    expect(members.length).toBeGreaterThan(0);
    expect(members[0].user_name).toBeDefined();
    expect(['focusing', 'break', 'idle']).toContain(members[0].current_status);
  });

  it('deve enviar e persistir mensagens no chat do grupo', () => {
    const groups = storageGroups.getGroups();
    const targetGroup = groups[0];

    const messageText = 'Olá a todos! Começando agora meu bloco de 50 minutos de foco.';
    const sent = storageGroups.sendMessage(targetGroup.id, messageText, 'Dev Ana');

    expect(sent.id).toBeDefined();
    expect(sent.text).toBe(messageText);
    expect(sent.user_name).toBe('Dev Ana');

    const history = storageGroups.getMessages(targetGroup.id);
    expect(history.some((m) => m.text === messageText)).toBe(true);
  });

  it('deve permitir que um usuário entre no grupo usando um código de convite válido', () => {
    const groups = storageGroups.getGroups();
    const targetGroup = groups[0];
    const initialCount = targetGroup.member_count;

    const result = storageGroups.joinGroupByCode(targetGroup.code, 'Lucas Silva');
    expect(result.success).toBe(true);
    expect(result.group?.id).toBe(targetGroup.id);

    // Verifica que o membro foi adicionado
    const members = storageGroups.getMembers(targetGroup.id);
    expect(members.some((m) => m.user_name === 'Lucas Silva')).toBe(true);

    // Verifica incremento de membros
    const updatedGroups = storageGroups.getGroups();
    const updatedTarget = updatedGroups.find((g) => g.id === targetGroup.id);
    expect(updatedTarget?.member_count).toBe(initialCount + 1);

    // Verifica mensagem de boas-vindas do bot
    const messages = storageGroups.getMessages(targetGroup.id);
    expect(messages.some((m) => m.text.includes('Lucas Silva acabou de entrar'))).toBe(true);
  });

  it('deve retornar erro ao tentar entrar com código de convite inexistente', () => {
    const result = storageGroups.joinGroupByCode('CODIGO_INVALIDO_XYZ');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Grupo não encontrado com este código de convite.');
  });

  it('deve permitir ao criador excluir o grupo', () => {
    const newGroup = storageGroups.createGroup(
      {
        name: 'Grupo Para Deletar',
        description: 'Grupo temporário',
        category: 'Testes',
        avatar_icon: '🧪',
      },
      'Prof. Carlos'
    );

    expect(storageGroups.getGroups().some((g) => g.id === newGroup.id)).toBe(true);

    const deleted = storageGroups.deleteGroup(newGroup.id);
    expect(deleted).toBe(true);
    expect(storageGroups.getGroups().some((g) => g.id === newGroup.id)).toBe(false);
  });

  it('deve permitir que membros entrem e saiam do grupo livremente', () => {
    const groups = storageGroups.getGroups();
    const targetGroup = groups[0];

    // Entrar no grupo
    const joinRes = storageGroups.joinGroup(targetGroup.id, 'Mariana Aluna');
    expect(joinRes.success).toBe(true);
    let members = storageGroups.getMembers(targetGroup.id);
    expect(members.some((m) => m.user_name === 'Mariana Aluna')).toBe(true);

    // Sair do grupo
    const leaveRes = storageGroups.leaveGroup(targetGroup.id, 'Mariana Aluna');
    expect(leaveRes.success).toBe(true);
    members = storageGroups.getMembers(targetGroup.id);
    expect(members.some((m) => m.user_name === 'Mariana Aluna')).toBe(false);

    // Mensagem de saída foi enviada
    const messages = storageGroups.getMessages(targetGroup.id);
    expect(messages.some((m) => m.text.includes('Mariana Aluna saiu do grupo'))).toBe(true);
  });
});

