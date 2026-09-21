import { MindMap, MindMapNode } from '@/features/core/types';
import { STORAGE_KEYS, DEFAULT_MIND_MAPS } from '@/features/core/api/storageDefaults';

export type MindMapTemplate = 'blank' | 'study_summary' | 'project_breakdown';

export class StorageMindMapsService {
  public getLocalMindMaps(): MindMap[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MIND_MAPS);
      if (!data) {
        this.saveLocalMindMaps(DEFAULT_MIND_MAPS);
        return DEFAULT_MIND_MAPS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Falha ao ler mapas mentais do localStorage', e);
      return DEFAULT_MIND_MAPS;
    }
  }

  public saveLocalMindMaps(maps: MindMap[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(maps));
    } catch (e) {
      console.error('Falha ao salvar mapas mentais no localStorage', e);
    }
  }

  public getMindMapById(id: string): MindMap | null {
    const maps = this.getLocalMindMaps();
    return maps.find((m) => m.id === id) || null;
  }

  public createMindMap(
    title: string,
    description: string = '',
    projectId?: string,
    template: MindMapTemplate = 'blank'
  ): MindMap {
    const maps = this.getLocalMindMaps();
    const mapId = `map-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const rootId = `node-root-${Date.now()}`;
    const now = new Date().toISOString();

    let nodes: MindMapNode[] = [];

    if (template === 'study_summary') {
      nodes = [
        {
          id: rootId,
          parent_id: null,
          text: title.trim() || 'Resumo de Estudos',
          color: '#ff2a5f',
          icon: '📖',
          notes: 'Visão geral consolidada do tópico estudado.',
        },
        {
          id: `node-${Date.now()}-1`,
          parent_id: rootId,
          text: 'Conceitos Fundamentais',
          color: '#0ea5e9',
          icon: '💡',
          notes: 'Definições, princípios teóricos e fórmulas essenciais.',
        },
        {
          id: `node-${Date.now()}-2`,
          parent_id: rootId,
          text: 'Exemplos & Prática',
          color: '#10b981',
          icon: '🛠️',
          notes: 'Questões resolvidas, estudos de caso e aplicações do dia a dia.',
        },
        {
          id: `node-${Date.now()}-3`,
          parent_id: rootId,
          text: 'Pontos de Atenção & Pegadinhas',
          color: '#f59e0b',
          icon: '⚠️',
          notes: 'Exceções a regras, detalhes que costumam gerar confusão.',
        },
      ];
    } else if (template === 'project_breakdown') {
      nodes = [
        {
          id: rootId,
          parent_id: null,
          text: title.trim() || 'Plano de Projeto',
          color: '#8b5cf6',
          icon: '🚀',
          notes: 'Escopo e entregáveis estratégicos do projeto.',
        },
        {
          id: `node-${Date.now()}-1`,
          parent_id: rootId,
          text: 'Objetivos Principais',
          color: '#0ea5e9',
          icon: '🎯',
        },
        {
          id: `node-${Date.now()}-2`,
          parent_id: rootId,
          text: 'Etapas de Execução',
          color: '#10b981',
          icon: '📋',
        },
        {
          id: `node-${Date.now()}-3`,
          parent_id: rootId,
          text: 'Riscos & Mitigação',
          color: '#ef4444',
          icon: '🛡️',
        },
      ];
    } else {
      // Blank
      nodes = [
        {
          id: rootId,
          parent_id: null,
          text: title.trim() || 'Ideia Central',
          color: '#ff2a5f',
          icon: '🧠',
        },
      ];
    }

    const newMap: MindMap = {
      id: mapId,
      title: title.trim() || 'Novo Mapa Mental',
      description: description.trim(),
      project_id: projectId,
      root_node_id: rootId,
      nodes,
      created_at: now,
      updated_at: now,
    };

    maps.unshift(newMap);
    this.saveLocalMindMaps(maps);
    return newMap;
  }

  public updateMindMap(id: string, updates: Partial<Omit<MindMap, 'id' | 'created_at'>>): MindMap | null {
    const maps = this.getLocalMindMaps();
    const index = maps.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updatedMap: MindMap = {
      ...maps[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    maps[index] = updatedMap;
    this.saveLocalMindMaps(maps);
    return updatedMap;
  }

  public deleteMindMap(id: string): void {
    const maps = this.getLocalMindMaps().filter((m) => m.id !== id);
    this.saveLocalMindMaps(maps);
  }

  // ----------------------------------------------------------------------------
  // Operações com Nós do Mapa Mental
  // ----------------------------------------------------------------------------

  public addNode(
    mapId: string,
    parentId: string,
    text: string = 'Novo Tópico',
    color?: string,
    notes?: string
  ): MindMapNode | null {
    const map = this.getMindMapById(mapId);
    if (!map) return null;

    const parentNode = map.nodes.find((n) => n.id === parentId);
    if (!parentNode) return null;

    const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNode: MindMapNode = {
      id: newNodeId,
      parent_id: parentId,
      text: text.trim() || 'Novo Tópico',
      color: color || parentNode.color || '#0ea5e9',
      notes,
    };

    map.nodes.push(newNode);
    this.updateMindMap(mapId, { nodes: map.nodes });
    return newNode;
  }

  public updateNode(mapId: string, nodeId: string, updates: Partial<MindMapNode>): MindMapNode | null {
    const map = this.getMindMapById(mapId);
    if (!map) return null;

    const index = map.nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) return null;

    const updatedNode: MindMapNode = {
      ...map.nodes[index],
      ...updates,
    };

    map.nodes[index] = updatedNode;
    this.updateMindMap(mapId, { nodes: map.nodes });
    return updatedNode;
  }

  public deleteNode(mapId: string, nodeId: string): boolean {
    const map = this.getMindMapById(mapId);
    if (!map) return false;

    // Não permite deletar o nó raiz
    if (map.root_node_id === nodeId) return false;

    // Localiza recursivamente todos os IDs a serem removidos (nó + todos os descendentes)
    const idsToDelete = new Set<string>();

    const collectDescendants = (currentId: string) => {
      idsToDelete.add(currentId);
      const children = map.nodes.filter((n) => n.parent_id === currentId);
      for (const child of children) {
        collectDescendants(child.id);
      }
    };

    collectDescendants(nodeId);

    map.nodes = map.nodes.filter((n) => !idsToDelete.has(n.id));
    this.updateMindMap(mapId, { nodes: map.nodes });
    return true;
  }

  public toggleNodeCollapse(mapId: string, nodeId: string): boolean {
    const map = this.getMindMapById(mapId);
    if (!map) return false;

    const node = map.nodes.find((n) => n.id === nodeId);
    if (!node) return false;

    node.is_collapsed = !node.is_collapsed;
    this.updateMindMap(mapId, { nodes: map.nodes });
    return true;
  }
}

export const storageMindMapsService = new StorageMindMapsService();
