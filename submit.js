// submit.js — A CAMADA DE ABSTRAÇÃO.
// O wizard só conhece submitLead(data). Trocar de backend = mudar
// CONFIG.BACKEND_DRIVER e (no futuro) preencher submitToSupabase().

import { CONFIG } from './config.js'

export async function submitLead(data) {
  if (CONFIG.BACKEND_DRIVER === 'supabase') return submitToSupabase(data)
  return submitToSheets(data)
}

// ── HOJE: Google Apps Script → Google Sheets ──────────────────────
async function submitToSheets(data) {
  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith('COLE_AQUI')) {
    throw new Error('APPS_SCRIPT_URL não configurada em config.js.')
  }
  // `no-cors`: o Apps Script não devolve cabeçalhos CORS fiáveis após o
  // redirect 302, e ler a resposta falha de forma intermitente conforme a
  // origem/browser (funciona em localhost, falha noutras origens). Em
  // `no-cors` o POST é SEMPRE entregue (grava a linha + envia o e-mail); a
  // resposta fica opaca (não-legível), o que é aceitável para captação de
  // leads. `text/plain` mantém-no como "simple request" (sem preflight).
  // Um erro de rede real continua a rejeitar e é tratado pela camada de UI.
  await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...data, _origin: 'anamnese-lead', _ts: new Date().toISOString() }),
  })
  return { ok: true }
}

// ── AMANHÃ: Supabase (tabela public.leads) ────────────────────────
// Quando migrares: cria a tabela + política de INSERT anónimo,
// preenche SUPABASE_URL / SUPABASE_ANON_KEY e troca BACKEND_DRIVER.
async function submitToSupabase(data) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = CONFIG
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase não configurado em config.js.')
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`)
  return { ok: true }
}
