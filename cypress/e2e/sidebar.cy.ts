describe('Barra Lateral Moderna (Sidebar)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve exibir a sidebar com marca, navegação, streak e projetos', () => {
    cy.get('.app-sidebar').should('be.visible');
    cy.get('.sidebar-brand-title').should('contain', 'FocusFlow');
    cy.get('.sidebar-streak-badge').should('be.visible');
    cy.get('.sidebar-nav').should('be.visible');
    cy.get('.sidebar-nav-item').should('have.length.at.least', 5);
  });

  it('deve recolher e expandir a sidebar no desktop ao clicar no botão de colapso', () => {
    // Sidebar inicialmente expandida
    cy.get('.app-sidebar').should('not.have.class', 'collapsed');
    cy.get('.sidebar-brand-title').should('be.visible');

    // Clica no botão de recolher
    cy.get('.sidebar-collapse-btn').click();
    cy.get('.app-sidebar').should('have.class', 'collapsed');
    cy.get('.sidebar-brand-title').should('not.exist');

    // Clica no botão de expandir
    cy.get('.sidebar-collapse-btn').click();
    cy.get('.app-sidebar').should('not.have.class', 'collapsed');
    cy.get('.sidebar-brand-title').should('be.visible');
  });

  it('deve navegar entre as telas através dos itens da sidebar', () => {
    // Clica em "Projetos" na sidebar
    cy.get('.sidebar-nav-item').contains('Projetos').click();
    cy.contains('h2', 'Projetos & Tarefas').should('be.visible');

    // Clica em "Calendário" na sidebar
    cy.get('.sidebar-nav-item').contains('Calendário').click();
    cy.contains('h2', 'Calendário & Agenda').should('be.visible');

    // Clica em "Foco" na sidebar
    cy.get('.sidebar-nav-item').contains('Foco').click();
    cy.get('[data-testid="timer-display"]').should('be.visible');
  });

  it('deve abrir a gaveta no mobile ao clicar no botão de menu', () => {
    cy.viewport(400, 800);
    cy.get('.mobile-sidebar-toggle').should('be.visible').click();

    cy.get('.app-sidebar').should('have.class', 'mobile-open');
    cy.get('.sidebar-mobile-backdrop').should('exist');

    // Fecha clicando no botão fechar da sidebar mobile
    cy.get('.sidebar-mobile-close-btn').click();
    cy.get('.app-sidebar').should('not.have.class', 'mobile-open');
  });
});
