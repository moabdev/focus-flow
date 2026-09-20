describe('Fluxos do Timer Pomodoro', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve carregar a página com timer inicial de 25:00', () => {
    cy.get('[data-testid="timer-display"]').should('contain', '25:00');
    cy.get('[data-testid="timer-start-btn"]').should('contain', 'Iniciar');
  });

  it('deve alternar para modo Pausa Curta e Pausa Longa', () => {
    cy.contains('button', 'Pausa Curta').click();
    cy.get('[data-testid="timer-display"]').should('contain', '05:00');

    cy.contains('button', 'Pausa Longa').click();
    cy.get('[data-testid="timer-display"]').should('contain', '15:00');

    cy.contains('button', 'Pomodoro').click();
    cy.get('[data-testid="timer-display"]').should('contain', '25:00');
  });

  it('deve iniciar e pausar o cronômetro', () => {
    cy.get('[data-testid="timer-start-btn"]').click();
    cy.get('[data-testid="timer-start-btn"]').should('contain', 'Pausar');

    cy.get('[data-testid="timer-start-btn"]').click();
    cy.get('[data-testid="timer-start-btn"]').should('contain', 'Iniciar');
  });
});
