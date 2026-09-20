# FocusFlow 🎯

> Gerenciador Moderno de Estudos e Pomodoro de Alta Performance desenvolvido com **React**, **TypeScript**, **Supabase (PostgreSQL + Google OAuth)**, suíte de **testes com Vitest & Cypress** e design refinado em **Glassmorphism**.

---

## ✨ Funcionalidades Principais

- ⏱️ **Timer Pomodoro Inteligente**: Anel circular dinâmico em SVG com contagem regressiva precisa compensada por timestamp delta, modos Pomodoro (25m), Pausa Curta (5m) e Pausa Longa (15m), além de atalhos de teclado (`Espaço`, `Alt+S`, `Alt+R`, `Alt+Z`).
- 🌓 **Dark & Light Mode + 5 Paletas de Cores**:
  - *Ruby Focus* (Carmim/Rosa moderno)
  - *Deep Ocean* (Azul safira/Ciano)
  - *Matcha Zen* (Verde sálvia/Menta)
  - *Midnight OLED* (Preto absoluto com toques neon)
  - *Sunset Glow* (Âmbar e pêssego)
  - Suporte a *Focus Dimming* (escurecimento automático suave durante os ciclos de foco).
- 🧠 **Frases Motivacionais & Mantras Pessoais**: Biblioteca com dezenas de citações em português (Foco, Disciplina, Resiliência, Calma), botão de sorteio dinâmico e opção para cadastrar metas e mantras pessoais (ex.: *"Aprovação 2026"*).
- 🌧️ **Áudio Ambiente Nativo (Web Audio API)**: Sons de foco sintetizados 100% offline (sem arquivos de áudio externos):
  - Chuva suave
  - Ruído Marrom (*Brownian Noise* - excelente para hiperfoco e TDAH)
  - Ruído Branco
  - Alarmes harmônicos de cristal, sino zen 528Hz e digital tech.
- 🗄️ **Supabase (PostgreSQL) + Google OAuth**:
  - Autenticação com 1 clique usando conta Google.
  - Sincronização em nuvem protegida por **Row Level Security (RLS)**.
  - **Arquitetura Offline-First**: Opera 100% no `localStorage` caso não haja conexão ou login, com opção de migrar dados locais para a nuvem no primeiro login.
  - Exportação e importação de backup completo em arquivo `.json`.
- 🔥 **Gamificação & Métricas**:
  - Contador de ofensiva diária (**Streak**).
  - Horas estudadas hoje, na semana e total de ciclos.
  - Gráfico de distribuição de tempo por disciplina.
  - Histórico cronológico das últimas sessões.
- 📝 **Bloco de Notas Rápidas (Scratchpad)**: Gaveta retrátil para registrar dúvidas e insights durante a sessão com salvamento automático (*debounce*).
- 🧘 **Modo Zen (Fullscreen)**: Interface minimalista de foco total com respiração visual e som ambiente.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18+, TypeScript 5+, Vite
- **Estilização**: Vanilla CSS / CSS Custom Properties com Glassmorphism (`backdrop-filter`)
- **Backend / Nuvem**: Supabase (PostgreSQL, Supabase Auth com Google OAuth)
- **Áudio**: Web Audio API nativa
- **Testes Unitários**: Vitest + React Testing Library + `@testing-library/jest-dom` + `jsdom`
- **Testes End-to-End (E2E)**: Cypress
- **Versionamento**: Conventional Commits

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ e NPM

### 2. Instalação
```bash
npm install
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.

### 4. Executar Testes Unitários
```bash
npm test
```

### 5. Executar Testes End-to-End (Cypress)
```bash
npm run cypress:run
```

### 6. Build de Produção
```bash
npm run build
```

---

## 🗄️ Configuração do Banco de Dados (Supabase)

Para ativar a sincronização na nuvem com autenticação Google:
1. Crie um projeto gratuito no [Supabase](https://supabase.com/).
2. Abra o **SQL Editor** do Supabase e execute o conteúdo de `supabase-schema.sql`.
3. No painel do Supabase, habilite o provedor de autenticação **Google** em *Authentication > Providers*.
4. No FocusFlow, acesse **Configurações > Nuvem** e insira a `SUPABASE_URL` e `SUPABASE_ANON_KEY` (ou defina no arquivo `.env`).

---

## 📜 Padrão de Commits

Este repositório adota a especificação **Conventional Commits**:
- `feat:` Novas funcionalidades.
- `fix:` Correções de bugs.
- `test:` Testes unitários ou testes Cypress.
- `refactor:` Melhorias internas no código.
- `docs:` Atualizações em documentações.
- `chore:` Configurações, dependências e tarefas de build.
