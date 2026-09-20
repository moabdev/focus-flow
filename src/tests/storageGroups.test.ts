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
});
