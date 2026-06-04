// wizard.js — Orquestra os passos: render, navegação, validação,
// persistência em localStorage e envio via submitLead().

import { STEPS } from './schema.js'
import { createField } from './fields.js'
import { submitLead } from './submit.js'

const STORAGE_KEY = 'trinus_lead_v1'

const state = loadState()
let current = 0 // índice do passo atual

// Elementos do DOM
const el = {
  progressFill: document.getElementById('progress-fill'),
  stepNow: document.getElementById('step-now'),
  stepTotal: document.getElementById('step-total'),
  stepName: document.getElementById('step-name'),
  card: document.getElementById('card'),
}

el.stepTotal.textContent = STEPS.length

// ── Persistência ──────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* storage cheio/privado — ignora */ }
}

// ── Campos visíveis (respeita showIf) ─────────────────────────────
function visibleFields(step) {
  return step.fields.filter((f) => !f.showIf || f.showIf(state))
}

// ── Validação do passo atual ──────────────────────────────────────
function validateStep(step) {
  for (const f of visibleFields(step)) {
    if (!f.required) continue
    const v = state[f.key]
    const empty =
      v == null ||
      v === '' ||
      (Array.isArray(v) && v.length === 0) ||
      (f.type === 'consent' && v !== true)
    if (empty) return { key: f.key, msg: `"${f.label.replace(/\s*\*$/, '')}" é obrigatório.` }

    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return { key: f.key, msg: 'Insere um e-mail válido. Ex: nome@dominio.com' }
    }
    if (f.type === 'phone' && String(v).replace(/\D/g, '').length < 6) {
      return { key: f.key, msg: 'Insere um número de WhatsApp válido.' }
    }
  }
  return null
}

// ── Render do passo ───────────────────────────────────────────────
function renderStep() {
  const step = STEPS[current]
  el.stepNow.textContent = current + 1
  el.stepName.textContent = step.title
  el.progressFill.style.width = `${((current + 1) / STEPS.length) * 100}%`

  const frag = document.createElement('div')
  frag.className = 'step'

  const head = document.createElement('div')
  head.className = 'step-head'
  head.innerHTML = `<div class="step-head__icon">${step.icon}</div>`
  const title = document.createElement('h2')
  title.className = 'step-head__title'
  title.textContent = step.title
  const sub = document.createElement('p')
  sub.className = 'step-head__sub'
  sub.textContent = step.subtitle
  head.append(title, sub)
  frag.appendChild(head)

  visibleFields(step).forEach((f) => frag.appendChild(createField(f, state)))

  el.card.innerHTML = ''
  el.card.appendChild(frag)
  el.card.appendChild(buildNav())
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function buildNav() {
  const nav = document.createElement('div')
  nav.className = 'nav'

  const back = document.createElement('button')
  back.className = 'btn btn--ghost'
  back.textContent = '← Anterior'
  back.disabled = current === 0
  back.addEventListener('click', goBack)

  const isLast = current === STEPS.length - 1
  const next = document.createElement('button')
  next.className = 'btn btn--primary'
  next.id = 'btn-next'
  next.textContent = isLast ? '✓ Enviar' : 'Próximo →'
  next.addEventListener('click', goNext)

  nav.append(back, next)
  return nav
}

function showError(err) {
  clearError()
  const box = document.createElement('div')
  box.className = 'step-error'
  box.textContent = err.msg
  el.card.querySelector('.nav').before(box)
  const fieldEl = el.card.querySelector(`.field[data-key="${err.key}"]`)
  if (fieldEl) {
    fieldEl.classList.add('field--invalid')
    fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
function clearError() {
  el.card.querySelector('.step-error')?.remove()
  el.card.querySelectorAll('.field--invalid').forEach((f) => f.classList.remove('field--invalid'))
}

function goBack() {
  if (current === 0) return
  current--
  renderStep()
}

async function goNext() {
  clearError()
  const step = STEPS[current]
  const err = validateStep(step)
  if (err) return showError(err)
  saveState()

  if (current < STEPS.length - 1) {
    current++
    renderStep()
    return
  }
  await finish()
}

// ── Envio final ───────────────────────────────────────────────────
async function finish() {
  // Honeypot: se preenchido, é bot — finge sucesso sem enviar.
  const hp = document.getElementById('hp-field')
  if (hp && hp.value) return renderSuccess()

  const btn = document.getElementById('btn-next')
  btn.disabled = true
  btn.innerHTML = '<span class="spinner"></span> A enviar...'

  try {
    await submitLead(buildPayload())
    localStorage.removeItem(STORAGE_KEY)
    renderSuccess()
  } catch (e) {
    btn.disabled = false
    btn.textContent = '✓ Enviar'
    showError({ key: '', msg: 'Não foi possível enviar agora. Verifica a ligação e tenta novamente.' })
    console.error(e)
  }
}

function buildPayload() {
  // Achata em chaves planas (boas para colunas de planilha).
  const payload = { ...state }
  for (const k of Object.keys(payload)) {
    if (Array.isArray(payload[k])) payload[k] = payload[k].join(', ')
  }
  return payload
}

function renderSuccess() {
  el.progressFill.style.width = '100%'
  const nome = (state.nome_completo || '').split(' ')[0]
  el.card.innerHTML = `
    <div class="success">
      <div class="success__badge">✓</div>
      <h2 class="success__title">Recebido${nome ? `, ${escapeHtml(nome)}` : ''}! 🎉</h2>
      <p class="success__text">A tua anamnese chegou. Vou analisar e entrar em contacto em breve com o próximo passo da tua transformação.</p>
      <div class="success__actions" id="success-actions"></div>
    </div>`
  injectSuccessActions()
}

function injectSuccessActions() {
  // Importa CONFIG dinamicamente para evitar acoplamento no topo do módulo.
  import('./config.js').then(({ CONFIG }) => {
    const box = document.getElementById('success-actions')
    if (CONFIG.WHATSAPP_CONTACT) {
      const wa = document.createElement('a')
      wa.className = 'btn btn--whatsapp'
      wa.href = `https://wa.me/${CONFIG.WHATSAPP_CONTACT}`
      wa.textContent = '💬 Falar agora no WhatsApp'
      box.appendChild(wa)
    }
    if (CONFIG.LANDING_URL && CONFIG.LANDING_URL !== '#') {
      const back = document.createElement('a')
      back.className = 'btn btn--link'
      back.href = CONFIG.LANDING_URL
      back.textContent = 'Voltar ao site'
      box.appendChild(back)
    }
  })
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Arranque
renderStep()
