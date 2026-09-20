describe('Navegação de Visualizações, Editor Notion e Calendário Time-Blocking', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve alternar entre as abas Foco, Projetos e Calendário', () => {
    // Aba Foco (padrão)
    cy.get('[data-testid="timer-display"]').should('be.visible');

    // Alterna para Projetos
    cy.contains('nav button', 'Projetos').click();
    cy.contains('h2', 'Projetos & Tarefas').should('be.visible');

    // Alterna para Calendário
    cy.contains('nav button', 'Calendário').click();
    cy.contains('h2', 'Calendário & Agenda').should('be.visible');
    cy.get('.time-blocking-grid').should('be.visible');

    // Retorna para Foco
    cy.contains('nav button', 'Foco').click();
    cy.get('[data-testid="timer-display"]').should('be.visible');
  });

  it('deve abrir o Editor Notion para uma subtask e permitir editar notas', () => {
    cy.contains('nav button', 'Projetos').click();

    // Abre o editor de anotações
    cy.get('.notion-notes-btn').first().click();
    cy.get('.notion-editor-modal').should('be.visible');
    cy.get('.notion-toolbar').should('be.visible');

    // Adiciona nota na textarea
    cy.get('.notion-textarea').clear().type('# Minha Nova Nota\n- [ ] Estudo avançado\n> 💡 Foco absoluto');
    cy.get('.notion-preview-content').should('contain', 'Minha Nova Nota');

    // Fecha o modal
    cy.get('button[aria-label="Fechar editor"]').click();
    cy.get('.notion-editor-modal').should('not.exist');
  });

  it('deve permitir agendar um bloco no calendário e focar imediatamente', () => {
    cy.contains('nav button', 'Calendário').click();
    cy.contains('h2', 'Calendário & Agenda').should('be.visible');

    // Clica no botão de novo agendamento
    cy.contains('button', 'Novo Agendamento').click();
    cy.get('.modal-title').should('contain', 'Novo Bloco');

    cy.get('input[placeholder*="Resolver 20 questões"]').type('Sessão Especial de Algoritmos');
    cy.contains('button', 'Agendar Bloco').click();

    cy.contains('Sessão Especial de Algoritmos').should('be.visible');

    // Se houver botão "Focar Agora" em algum evento, clica para redirecionar para o Timer
    cy.get('.event-focus-btn').first().click();
    cy.get('[data-testid="timer-display"]').should('be.visible');
  });
});
