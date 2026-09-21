import { describe, it, expect, beforeEach } from 'vitest';
import { StorageMindMapsService } from '@/features/mindmaps/api/storageMindMaps';

describe('StorageMindMapsService', () => {
  let service: StorageMindMapsService;

  beforeEach(() => {
    localStorage.clear();
    service = new StorageMindMapsService();
  });

  it('deve iniciar com 0 mapas mentais (dados de exemplo removidos)', () => {
    const maps = service.getLocalMindMaps();
    expect(maps.length).toBe(0);
  });

  it('deve criar um novo mapa mental com template em branco', () => {
    const created = service.createMindMap('Novo Tópico de Estudo', 'Descrição do mapa');
    expect(created.id).toMatch(/^map-/);
    expect(created.title).toBe('Novo Tópico de Estudo');
    expect(created.nodes.length).toBe(1); // Somente a raiz
    expect(created.nodes[0].parent_id).toBeNull();
  });

  it('deve criar mapa mental a partir do template de resumo de estudo', () => {
    const created = service.createMindMap('Resumo de Física Quântica', '', undefined, 'study_summary');
    expect(created.nodes.length).toBe(4); // Raiz + 3 ramificações pré-configuradas
    expect(created.nodes.some((n) => n.text === 'Conceitos Fundamentais')).toBe(true);
    expect(created.nodes.some((n) => n.text === 'Exemplos & Prática')).toBe(true);
  });

  it('deve adicionar nó filho e atualizar nó com anotações', () => {
    const map = service.createMindMap('Projeto Teste');
    const rootId = map.root_node_id;

    const childNode = service.addNode(map.id, rootId, 'Sub-tópico 1', '#0ea5e9', 'Anotações importantes');
    expect(childNode).not.toBeNull();
    expect(childNode?.parent_id).toBe(rootId);
    expect(childNode?.text).toBe('Sub-tópico 1');
    expect(childNode?.notes).toBe('Anotações importantes');

    // Atualiza o nó
    const updated = service.updateNode(map.id, childNode!.id, { text: 'Sub-tópico Renomeado' });
    expect(updated?.text).toBe('Sub-tópico Renomeado');
  });

  it('deve deletar um nó e recursivamente todos os seus filhos sem afetar nós irmãos', () => {
    const map = service.createMindMap('Hierarquia');
    const root = map.root_node_id;

    const branchA = service.addNode(map.id, root, 'Ramo A')!;
    const branchB = service.addNode(map.id, root, 'Ramo B')!;

    const subA1 = service.addNode(map.id, branchA.id, 'Sub A1')!;
    const subA2 = service.addNode(map.id, branchA.id, 'Sub A2')!;
    const subA1Deep = service.addNode(map.id, subA1.id, 'Sub A1 Profundo')!;

    const mapBeforeDelete = service.getMindMapById(map.id)!;
    expect(mapBeforeDelete.nodes.length).toBe(6); // root + A + B + A1 + A2 + A1Deep

    // Deleta Ramo A -> Deve remover A, A1, A2 e A1Deep, mas manter root e Ramo B
    const success = service.deleteNode(map.id, branchA.id);
    expect(success).toBe(true);

    const mapAfterDelete = service.getMindMapById(map.id)!;
    expect(mapAfterDelete.nodes.length).toBe(2); // root + Ramo B
    expect(mapAfterDelete.nodes.some((n) => n.id === branchB.id)).toBe(true);
    expect(mapAfterDelete.nodes.some((n) => n.id === branchA.id)).toBe(false);
  });

  it('não deve permitir a exclusão do nó raiz', () => {
    const map = service.createMindMap('Proteção Raiz');
    const success = service.deleteNode(map.id, map.root_node_id);
    expect(success).toBe(false);
  });
});
