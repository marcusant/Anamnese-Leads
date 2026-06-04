// fields.js — Renderização de cada tipo de campo do schema.
// Cada control escreve diretamente no objeto `state` (key → valor).

import { COUNTRY_CODES } from './schema.js'
import { CONFIG } from './config.js'

const NONE_VALUES = ['Nenhuma', 'Nenhum', 'Não se aplica']

// Cria o wrapper .field com label + control + help. Devolve o elemento.
export function createField(field, state) {
  const wrap = document.createElement('div')
  wrap.className = 'field'
  wrap.dataset.key = field.key

  if (field.type !== 'consent') {
    const label = document.createElement('label')
    label.className = 'field__label'
    label.textContent = field.label
    if (field.required) {
      const star = document.createElement('span')
      star.className = 'field__req'
      star.textContent = ' *'
      label.appendChild(star)
    }
    wrap.appendChild(label)
  }

  wrap.appendChild(buildControl(field, state))

  if (field.help) {
    const help = document.createElement('p')
    help.className = 'field__help'
    help.textContent = field.help
    wrap.appendChild(help)
  }
  return wrap
}

function buildControl(field, state) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
    case 'date':
      return buildInput(field, state)
    case 'phone':
      return buildPhone(field, state)
    case 'textarea':
      return buildTextarea(field, state)
    case 'radio':
      return buildRadio(field, state)
    case 'chips':
      return buildChips(field, state)
    case 'slider':
      return buildSlider(field, state)
    case 'consent':
      return buildConsent(field, state)
    default:
      return document.createTextNode('')
  }
}

function buildInput(field, state) {
  const input = document.createElement('input')
  const typeMap = { text: 'text', email: 'email', number: 'number', date: 'date' }
  input.type = typeMap[field.type]
  if (field.placeholder) input.placeholder = field.placeholder
  if (field.min != null) input.min = field.min
  if (field.max != null) input.max = field.max
  if (field.step != null) input.step = field.step
  if (state[field.key] != null) input.value = state[field.key]
  input.addEventListener('input', () => {
    state[field.key] = input.value === '' ? null : input.value
  })
  return input
}

function buildPhone(field, state) {
  const row = document.createElement('div')
  row.className = 'phone'

  const select = document.createElement('select')
  COUNTRY_CODES.forEach((c) => {
    const opt = document.createElement('option')
    opt.value = c.code
    opt.textContent = c.label
    select.appendChild(opt)
  })
  select.value = state.codigo_pais || CONFIG.DEFAULT_COUNTRY_CODE
  state.codigo_pais = select.value
  select.addEventListener('change', () => { state.codigo_pais = select.value })

  const input = document.createElement('input')
  input.type = 'tel'
  input.inputMode = 'tel'
  input.placeholder = field.placeholder || ''
  if (state[field.key] != null) input.value = state[field.key]
  input.addEventListener('input', () => {
    state[field.key] = input.value.replace(/[^\d\s]/g, '') || null
  })

  row.append(select, input)
  return row
}

function buildTextarea(field, state) {
  const ta = document.createElement('textarea')
  if (field.placeholder) ta.placeholder = field.placeholder
  if (state[field.key] != null) ta.value = state[field.key]
  ta.addEventListener('input', () => {
    state[field.key] = ta.value.trim() === '' ? null : ta.value
  })
  return ta
}

function buildRadio(field, state) {
  const group = document.createElement('div')
  group.className = 'options'
  field.options.forEach((value) => {
    const opt = document.createElement('button')
    opt.type = 'button'
    opt.className = 'opt'
    opt.textContent = value
    if (state[field.key] === value) opt.classList.add('opt--selected')
    opt.addEventListener('click', () => {
      state[field.key] = value
      group.querySelectorAll('.opt').forEach((o) => o.classList.remove('opt--selected'))
      opt.classList.add('opt--selected')
    })
    group.appendChild(opt)
  })
  return group
}

function buildChips(field, state) {
  if (!Array.isArray(state[field.key])) state[field.key] = []
  const color = field.color || 'primary'
  const group = document.createElement('div')
  group.className = 'chips'

  const sync = () => {
    group.querySelectorAll('.chip').forEach((chip) => {
      const on = state[field.key].includes(chip.dataset.value)
      chip.classList.toggle('chip--selected', on)
      chip.classList.toggle(`c-${color}`, on)
    })
  }

  field.options.forEach((value) => {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'chip'
    chip.dataset.value = value
    chip.textContent = value
    chip.addEventListener('click', () => {
      const arr = state[field.key]
      const isNone = NONE_VALUES.includes(value)
      if (arr.includes(value)) {
        state[field.key] = arr.filter((v) => v !== value)
      } else if (isNone) {
        state[field.key] = [value] // "Nenhuma" limpa as outras
      } else {
        state[field.key] = [...arr.filter((v) => !NONE_VALUES.includes(v)), value]
      }
      sync()
    })
    group.appendChild(chip)
  })
  sync()
  return group
}

function buildSlider(field, state) {
  if (state[field.key] == null) state[field.key] = field.default ?? Math.round((field.min + field.max) / 2)
  const wrap = document.createElement('div')
  wrap.className = 'slider-wrap'

  const row = document.createElement('div')
  row.className = 'slider-row'

  const range = document.createElement('input')
  range.type = 'range'
  range.min = field.min
  range.max = field.max
  range.step = 1
  range.value = state[field.key]

  const bubble = document.createElement('span')
  bubble.className = 'slider-bubble'
  bubble.textContent = state[field.key]

  range.addEventListener('input', () => {
    state[field.key] = Number(range.value)
    bubble.textContent = range.value
  })
  row.append(range, bubble)

  const labels = document.createElement('div')
  labels.className = 'slider-labels'
  const lo = document.createElement('span'); lo.textContent = field.labels[0]
  const hi = document.createElement('span'); hi.textContent = field.labels[1]
  labels.append(lo, hi)

  wrap.append(row, labels)
  return wrap
}

function buildConsent(field, state) {
  const label = document.createElement('label')
  label.className = 'consent'
  const box = document.createElement('input')
  box.type = 'checkbox'
  box.checked = !!state[field.key]
  box.addEventListener('change', () => { state[field.key] = box.checked })
  const span = document.createElement('span')
  span.textContent = field.label
  label.append(box, span)
  return label
}
