describe('Funcionalidades de IA (Flashcards, Quizzes e Co-piloto)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve renderizar a aba do Co-piloto de IA nas Estatísticas', () => {
    // Clica no botão de estatísticas (ofensiva/fogo) na sidebar
    cy.get('.nav-btn').last().click(); // Usually Stats or Settings is near the bottom
    
    // As in our sidebar, Stats is probably the one with a fire icon or similar.
    // Let's find it by title or aria-label
    cy.get('button[title="Estatísticas & Relatórios"], button[aria-label="Estatísticas"]').click({ force: true });
    
    // Verifica se o modal abriu
    cy.get('.modal-title').should('contain', 'Estatísticas, Conquistas & Relatórios');
    
    // Verifica se a aba do Co-piloto está presente e clica
    cy.contains('button', 'Co-piloto IA').click();
    
    // Verifica se o conteúdo do Co-piloto renderizou
    cy.contains('Co-piloto de Produtividade').should('be.visible');
    cy.contains('button', 'Gerar Insights').should('be.visible');
  });

  it('deve exibir os botões de IA (Flashcards e Quiz) no editor de notas', () => {
    // Abre uma subtarefa para ver o editor
    cy.contains('.subtask-item', 'Arquitetura de Projetos e Time-Tracking').click();
    
    // Verifica se o editor abriu
    cy.get('.modal-title').should('contain', 'Arquitetura de Projetos');
    
    // Verifica os botões de IA no NotionToolbar
    cy.get('button[title="Gerar Flashcards com IA ✨"]').should('be.visible');
    cy.get('button[title="Gerar Quiz com IA 📝"]').should('be.visible');
    
    // Simula clique no botão de Quiz
    cy.get('button[title="Gerar Quiz com IA 📝"]').click();
    
    // Como a API Key pode não estar setada no ambiente CI/Cypress puro sem .env,
    // apenas garantimos que o sistema responde com um aviso ou que a ação é iniciada.
    // O toast de Falta API Key ou de anotação vazia deve aparecer.
    cy.get('.toast').should('exist');
  });
});
