import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '@/features/core/api/storage';
import { QuickNote, Task, Project } from '@/features/core/types';

describe('Segurança, Sanitização e Validação de Dados (Fase 3 QA)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Proteção contra Injeção e XSS (Cross-Site Scripting)', () => {
    it('deve armazenar e recuperar payloads de injeção XSS como texto puro', () => {
      const maliciousPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(document.cookie)>',
        '<svg onload=alert(1)>',
        '"><script src=evil.com></script>',
        'javascript:void(0)',
      ];

      maliciousPayloads.forEach((payload, index) => {
        const note = storageService.createQuickNote({
          title: `Nota Segura ${index}: ${payload}`,
          content: payload,
        });

        expect(note.content).toBe(payload);
        expect(note.title).toContain(payload);

        // Recupera do storage e garante que o payload é preservado como string inofensiva
        const notes = storageService.getQuickNotes();
        const savedNote = notes.find((n) => n.id === note.id);
        expect(savedNote?.content).toBe(payload);
      });
    });
  });

  describe('2. Matriz de Dados Inválidos e Casos de Borda', () => {
    it('deve lidar de forma resiliente com strings contendo emojis e caracteres Unicode complexos', () => {
      const unicodeTitle = 'Projeto Inteligente 🚀🔥 (São Paulo / Ação & Emoção)';
      const unicodeContent = '日本語テキスト • العربية • Emoji sequence: 👨‍💻👩‍🚀🎯';

      const note = storageService.createQuickNote({
        title: unicodeTitle,
        content: unicodeContent,
      });

      expect(note.title).toBe(unicodeTitle);
      expect(note.content).toBe(unicodeContent);

      const notes = storageService.getQuickNotes();
      expect(notes[0].title).toBe(unicodeTitle);
      expect(notes[0].content).toBe(unicodeContent);
    });

    it('deve suportar volumes elevados de texto sem corrupção ou travamento', () => {
      const largeContent = 'A'.repeat(50000); // 50.000 caracteres
      const note = storageService.createQuickNote({
        title: 'Documento Extenso de Estudo',
        content: largeContent,
      });

      expect(note.content.length).toBe(50000);
      const notes = storageService.getQuickNotes();
      expect(notes[0].content.length).toBe(50000);
    });
  });

  describe('3. Simulação de Isolamento Multi-Tenant & RLS (Row Level Security)', () => {
    it('deve manter integridade de dados vinculados a projetos e subtarefas', () => {
      const project: Project = {
        id: 'proj-tenant-1',
        title: 'Projeto Tenant Alpha',
        description: 'Isolamento de tenant',
        color: '#ff2a5f',
        icon: '📁',
        total_elapsed_seconds: 0,
        created_at: new Date().toISOString(),
      };

      const projects = storageService.getLocalProjects();
      storageService.saveLocalProjects([...projects, project]);

      const note = storageService.createQuickNote({
        title: 'Nota do Tenant Alpha',
        content: 'Conteúdo restrito',
        project_id: project.id,
      });

      expect(note.project_id).toBe('proj-tenant-1');
      const retrieved = storageService.getQuickNotes().find((n) => n.id === note.id);
      expect(retrieved?.project_id).toBe('proj-tenant-1');
    });
  });

  describe('4. Auditoria de Segredos e Variáveis Públicas', () => {
    it('não deve expor service_role key em variáveis globais ou de ambiente do cliente', () => {
      // Garante que o ambiente de execução do cliente não possua chaves administrativas de serviço
      const envVars = Object.keys(process.env || {});
      const hasServiceRole = envVars.some(
        (key) =>
          key.toLowerCase().includes('service_role') ||
          key.toLowerCase().includes('supabase_admin')
      );
      expect(hasServiceRole).toBe(false);
    });
  });
});
