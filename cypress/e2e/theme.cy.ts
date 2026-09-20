describe('Alternância de Temas Dark e Light Mode', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve alternar entre Dark Mode e Light Mode ao clicar no botão do cabeçalho', () => {
    cy.get('html').should('have.attr', 'data-color-mode');

    cy.get('button[aria-label="Alternar tema de cores"]').first().click();
    cy.get('html').should('have.attr', 'data-color-mode', 'light');

    cy.get('button[aria-label="Alternar tema de cores"]').first().click();
    cy.get('html').should('have.attr', 'data-color-mode', 'dark');
  });
});
