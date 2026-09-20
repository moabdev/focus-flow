describe('Gerenciamento de Projetos e Subtarefas', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve listar projetos e subtarefas padrão', () => {
    cy.contains('Projetos & Tarefas').should('be.visible');
    cy.contains('FocusFlow: Plataforma & Engenharia').should('be.visible');
    cy.contains('Arquitetura de Projetos e Time-Tracking por Subtask').should('be.visible');
  });

  it('deve permitir criar um novo projeto através do modal', () => {
    cy.contains('button', 'Novo Projeto').click();
    cy.get('.modal-title').should('contain', 'Novo Projeto');
    cy.get('input[placeholder*="Engenharia de Software"]').type('Projeto Teste Cypress');
    cy.get('textarea[placeholder*="Detalhes dos objetivos"]').type('Objetivos de validação automatizada');
    cy.contains('button', 'Salvar Projeto').click();

    cy.contains('Projeto Teste Cypress').should('be.visible');
  });

  it('deve permitir marcar uma subtarefa como concluída', () => {
    cy.get('.task-checkbox').first().click();
    cy.get('.subtask-item').first().should('have.class', 'completed');
  });
});
