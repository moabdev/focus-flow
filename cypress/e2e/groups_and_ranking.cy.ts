describe('Grupos de Estudo, Ranking Semanal e Página Individual de Projetos', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve navegar para a página individual do projeto ao clicar nele na barra lateral', () => {
    // Clica no primeiro projeto na barra lateral
    cy.get('.sidebar-project-item').first().click();

    // Deve exibir o container de detalhes do projeto
    cy.get('.project-detail-container').should('be.visible');
    cy.get('.project-detail-hero').should('be.visible');
    cy.get('.project-hero-title').should('be.visible');
    cy.get('.project-detail-subtasks-card').should('be.visible');

    // Botão de voltar deve retornar para a listagem geral
    cy.get('.project-detail-back-btn').click();
    cy.contains('h2', 'Projetos & Tarefas').should('be.visible');
  });

  it('deve alternar para a visualização de Grupos de Estudo e enviar uma mensagem no chat', () => {
    cy.contains('nav.sidebar-nav button', 'Grupos').click();

    // Deve exibir a interface de grupos e chat expandido
    cy.get('.study-groups-container').should('be.visible');
    cy.get('.group-chat-panel').should('be.visible');
    cy.get('.group-members-btn').should('be.visible');

    // Digita e envia uma mensagem no chat
    const testMsg = 'Testando chat de estudos em tempo real no Cypress!';
    cy.get('.chat-text-input').type(`${testMsg}{enter}`);

    // Mensagem deve aparecer no feed
    cy.contains('.chat-bubble', testMsg).should('be.visible');

    // Testa botão de Convidar
    cy.get('.group-invite-btn').should('be.visible').click();
    cy.contains('.group-invite-btn', 'Copiado!').should('be.visible');

    // Testa modal de Entrar com Código
    cy.contains('button', 'Entrar com Código').click();
    cy.get('.modal-card').should('be.visible');
    cy.get('#join-group-code').type('MED-PRO');
    cy.contains('.modal-actions button', 'Entrar no Grupo').click();

    // Modal fecha e grupo 'Medicina & Residência' fica ativo
    cy.get('.modal-card').should('not.exist');
    cy.get('.group-chat-name').should('contain', 'Medicina');

    // Testa modal de Criação de Grupo e verifica padding
    cy.contains('button', 'Novo Grupo').click();
    cy.get('.modal-card').should('be.visible');
    cy.get('.modal-form')
      .should('be.visible')
      .should('have.css', 'padding')
      .and('not.eq', '0px');
    cy.get('#group-name').type('Grupo Teste Cypress');
    cy.contains('.modal-actions button', 'Criar Grupo').click();
    cy.get('.modal-card').should('not.exist');
    cy.contains('.group-item-name', 'Grupo Teste Cypress').should('be.visible');
  });

  it('deve alternar para o Ranking Semanal e exibir o pódio e tabela de classificação', () => {
    cy.contains('nav.sidebar-nav button', 'Ranking').click();

    // Deve exibir o pódio com Top 3
    cy.get('.ranking-view-container').should('be.visible');
    cy.get('.ranking-podium-grid').should('be.visible');
    cy.get('.podium-card.rank-1').should('be.visible');
    cy.get('.podium-card.rank-2').should('be.visible');
    cy.get('.podium-card.rank-3').should('be.visible');

    // Deve exibir a lista de classificação
    cy.get('.ranking-table-card').should('be.visible');
    cy.get('.ranking-row').should('have.length.greaterThan', 0);
  });

  it('deve alternar entre as visões de Dia, Semana e Mês no Calendário', () => {
    cy.contains('nav.sidebar-nav button', 'Calendário').click();
    cy.get('.calendar-controls-bar').should('be.visible');

    // Visão Dia ativa por padrão
    cy.get('.time-blocking-grid').should('be.visible');

    // Alterna para Semana
    cy.contains('.calendar-view-toggle button', 'Semana').click();
    cy.get('.calendar-week-grid').should('be.visible');

    // Alterna para Mês
    cy.contains('.calendar-view-toggle button', 'Mês').click();
    cy.get('.calendar-month-grid').should('be.visible');

    // Retorna para Dia
    cy.contains('.calendar-view-toggle button', 'Dia').click();
    cy.get('.time-blocking-grid').should('be.visible');
  });
});
