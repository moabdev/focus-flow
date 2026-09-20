describe('Rascunhos & Notas Rápidas (E2E)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve navegar para a tela de rascunhos pela sidebar', () => {
    cy.contains('button', 'Rascunhos').click();
    cy.contains('Rascunhos & Notas Rápidas').should('be.visible');
  });

  it('deve alternar entre visualização em Grade e Painel com Editor', () => {
    cy.contains('button', 'Rascunhos').click();
    
    // Alterna para Editor
    cy.contains('button', 'Editor').click();
    cy.get('.drafts-split-view').should('be.visible');
    cy.get('.split-editor-title-input').should('be.visible');

    // Volta para Grade
    cy.contains('button', 'Grade').click();
    cy.get('.drafts-grid').should('be.visible');
  });

  it('deve criar um novo rascunho e pesquisar', () => {
    cy.contains('button', 'Rascunhos').click();
    cy.contains('button', 'Novo Rascunho').click();

    // No modo split que abre após novo rascunho
    cy.get('.split-editor-title-input').clear().type('Nota Crítica E2E');
    cy.get('.split-editor-textarea').type('Conteúdo de teste para Cypress E2E');

    // Pesquisa pelo rascunho
    cy.get('.drafts-search-box input').type('Nota Crítica');
    cy.contains('Nota Crítica E2E').should('be.visible');
  });
});
