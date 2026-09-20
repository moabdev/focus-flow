describe('Gerenciamento de Tarefas e Disciplinas', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve listar tarefas iniciais e permitir adicionar uma nova tarefa', () => {
    cy.get('[data-testid="add-task-btn"]').click();
    cy.get('input[placeholder*="O que você vai estudar"]').type('Aprender Cypress E2E');
    cy.get('input[placeholder*="Disciplina"]').type('Testes de Software');
    cy.contains('button', 'Salvar Tarefa').click();

    cy.contains('Aprender Cypress E2E').should('be.visible');
    cy.contains('#Testes de Software').should('be.visible');
  });

  it('deve permitir marcar uma tarefa como concluída', () => {
    cy.get('.task-check-btn').first().click();
    cy.get('.task-item').first().should('have.class', 'completed');
  });
});
