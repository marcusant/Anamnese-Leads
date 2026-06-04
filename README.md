# Anamnese de Leads — TRINUS

Página estática de onboarding de leads: questionário progressivo (6 passos),
visual fiel à marca TRINUS, que envia os dados para uma Google Sheet via Google
Apps Script — com **camada de abstração** pronta para migrar para Supabase
trocando uma variável.

```
[ index.html + wizard.js ]        UI progressiva (6 passos)
        ↓
[ submitLead(data) ] (submit.js)  ← a ÚNICA peça que muda no futuro
        ↓ BACKEND_DRIVER='sheets'  (hoje)
[ Apps Script doPost ] → Google Sheets + e-mail/WhatsApp ao Marcus
        ↓ BACKEND_DRIVER='supabase' (amanhã)
[ Supabase REST → public.leads ]
```

## Ficheiros

| Ficheiro | Papel |
|---|---|
| `index.html` | Casca da página + honeypot anti-bot |
| `styles.css` | Tokens TRINUS + estilos do wizard |
| `schema.js` | **Fonte única** dos 6 passos e campos |
| `fields.js` | Renderização de cada tipo de campo |
| `wizard.js` | Navegação, validação, localStorage, envio |
| `submit.js` | **Seam** `submitLead()` — drivers sheets/supabase |
| `config.js` | URL do Apps Script, país default, WhatsApp, Supabase |
| `apps-script.gs` | Backend (colar no editor do Apps Script) |

## Deploy do Apps Script (backend de hoje)

1. Cria uma **Google Sheet** nova (será o teu CRM de leads).
2. Menu **Extensões → Apps Script**.
3. Apaga o conteúdo e **cola `apps-script.gs`** inteiro.
4. No topo do ficheiro, ajusta `CONFIG`:
   - `NOTIFY_EMAIL` — e-mail que recebe o alerta de cada lead.
   - `NOTIFY_ON_NEW_LEAD` — `true` para receber e-mail (com link wa.me do lead).
5. **Implementar → Nova implementação → tipo "App Web"**:
   - *Executar como:* **Eu**
   - *Quem tem acesso:* **Qualquer pessoa**
6. Autoriza (a 1ª vez pede permissão para Sheets + envio de e-mail).
7. Copia a **URL do App Web** (termina em `/exec`).
8. Cola essa URL em `config.js` → `APPS_SCRIPT_URL`.

> A planilha cria o cabeçalho automaticamente no 1º envio (aba "Leads").
> Testa a URL no browser: deve responder `{"ok":true,...}`.

### Notificação no WhatsApp

Hoje: e-mail automático a cada lead **com link `wa.me`** para responderes em 1
clique. O Apps Script não envia mensagem de WhatsApp sozinho sem um provedor —
se quiseres disparo automático, dá para integrar **CallMeBot** (grátis, para o
teu número) ou **Twilio** depois.

## Publicar a página

É 100% estática e o `index.html` está na **raiz do repositório** (sem subpasta),
por isso qualquer host serve direto:
- **Vercel** / **GitHub Pages** / **Netlify** — apontar para a raiz do repo, ou
- abre `index.html` num servidor local.

> Os specs de origem (Google Forms / app) ficam em `docs/` e não interferem no deploy.

> Os ficheiros usam `type="module"` (import/export), por isso precisa ser
> servido por **http://** — abrir o ficheiro com `file://` bloqueia os imports.

## Migrar para Supabase (amanhã)

1. Cria a tabela `public.leads` com colunas iguais às `COLUMNS` do `apps-script.gs`.
2. Política RLS: permitir `INSERT` ao papel `anon` **apenas** nesta tabela;
   `SELECT` só para ti/trainer/admin.
3. Em `config.js`: preenche `SUPABASE_URL` e `SUPABASE_ANON_KEY` e muda
   `BACKEND_DRIVER` para `'supabase'`.
4. (Bónus) Ao converter lead → utilizador, os `key` já espelham o `AnamneseData`
   do app, pré-preenchendo a anamnese completa.

## Personalizar o formulário

Tudo em `schema.js`. Para adicionar/remover perguntas, edita o array `STEPS`.
Se adicionares campos novos, junta o `key` ao array `COLUMNS` do `apps-script.gs`.
