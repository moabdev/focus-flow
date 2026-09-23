/**
 * Utilitários para sincronização
 */

export function mergeById<T extends { id: string }>(localList: T[], remoteList: T[]): T[] {
  const map = new Map<string, T>();
  // Itens remotos como base
  remoteList.forEach((item) => map.set(item.id, item));
  // Itens locais mesclados / sobrescrevendo se mais recentes
  localList.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}
