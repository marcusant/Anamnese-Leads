// config.js — Configuração central da Anamnese de Leads TRINUS.
// É o único arquivo que precisas editar para colocar a página no ar.

export const CONFIG = {
  // ── Backend ativo ───────────────────────────────────────────────
  // 'sheets'  → envia para o Google Apps Script (Google Sheets)  [HOJE]
  // 'supabase'→ envia para a tabela public.leads do Supabase       [AMANHÃ]
  BACKEND_DRIVER: 'sheets',

  // ── Google Apps Script (driver 'sheets') ───────────────────────
  // Cola aqui a URL do Web App depois de fazer "Implementar" no Apps Script.
  // Ver README.md → secção "Deploy do Apps Script".
  APPS_SCRIPT_URL: 'COLE_AQUI_A_URL_DO_APPS_SCRIPT',

  // ── Supabase (driver 'supabase', futuro) ────────────────────────
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // ── UX / Marca ──────────────────────────────────────────────────
  DEFAULT_COUNTRY_CODE: '+351',        // país pré-selecionado no telefone
  // Teu WhatsApp para o CTA final (formato internacional, só dígitos).
  // Ex: '351912345678'. Deixa vazio para esconder o botão.
  WHATSAPP_CONTACT: '5567999919646',
  LANDING_URL: '#',                    // link de "voltar ao site" no fim
}
