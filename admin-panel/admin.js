import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STORAGE_KEY = 'tendon_admin_creds'
let supabase = null
let configCache = {}
let pendingChanges = {}

const el = (id) => document.getElementById(id)

function toast(message, isError = false) {
  const t = el('toast')
  t.textContent = message
  t.className = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => { t.className = 'toast' }, 2500)
}

function saveCreds(url, key) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, key }))
}

function loadCreds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch { return null }
}

function clearCreds() {
  localStorage.removeItem(STORAGE_KEY)
}

async function connect(url, key) {
  try {
    supabase = createClient(url, key)
    const { error } = await supabase.from('app_config').select('key').limit(1)
    if (error) throw error
    return true
  } catch (e) {
    toast('Connection failed: ' + e.message, true)
    supabase = null
    return false
  }
}

async function loadConfig() {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value, description')
    .order('key')

  if (error) {
    toast('Failed to load config: ' + error.message, true)
    return
  }

  configCache = {}
  for (const row of data) configCache[row.key] = row

  renderConfig(data)
}

function renderConfig(rows) {
  const container = el('config-rows')
  container.innerHTML = ''
  for (const row of rows) {
    const field = document.createElement('div')
    field.className = 'field'
    field.innerHTML = `
      <label>${escapeHtml(row.key)}</label>
      <input type="text" data-key="${escapeHtml(row.key)}" value="${escapeHtml(row.value ?? '')}" />
      ${row.description ? `<div class="desc">${escapeHtml(row.description)}</div>` : ''}
    `
    field.querySelector('input').addEventListener('input', (e) => {
      pendingChanges[row.key] = e.target.value
    })
    container.appendChild(field)
  }
}

async function saveConfig() {
  const keys = Object.keys(pendingChanges)
  if (keys.length === 0) {
    toast('No changes to save')
    return
  }

  const updates = keys.map((key) => ({
    key,
    value: pendingChanges[key],
    description: configCache[key]?.description ?? null,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('app_config')
    .upsert(updates, { onConflict: 'key' })

  if (error) {
    toast('Save failed: ' + error.message, true)
    return
  }

  pendingChanges = {}
  toast('Saved ' + keys.length + ' value' + (keys.length === 1 ? '' : 's'))
  await loadConfig()
}

async function loadDevices() {
  const { data, error } = await supabase
    .from('devices')
    .select('id, name, firmware_version, last_seen_at')
    .order('id')

  if (error) {
    el('devices').innerHTML = `<p class="desc">Error: ${escapeHtml(error.message)}</p>`
    return
  }

  if (!data || data.length === 0) {
    el('devices').innerHTML = '<p class="desc">No devices registered yet.</p>'
    return
  }

  const html = data.map((d) => {
    const lastSeen = d.last_seen_at ? new Date(d.last_seen_at) : null
    const online = lastSeen && (Date.now() - lastSeen.getTime()) < 30000
    const lastSeenText = lastSeen ? timeAgo(lastSeen) : 'never'
    return `
      <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>${escapeHtml(d.name || d.id)}</strong>
        <span class="stat ${online ? 'online' : 'offline'}">${online ? 'online' : 'offline'}</span>
        <span class="stat">fw ${escapeHtml(d.firmware_version || 'unknown')}</span>
        <span class="stat">seen ${escapeHtml(lastSeenText)}</span>
      </div>
    `
  }).join('')

  el('devices').innerHTML = html
}

async function loadReadings() {
  const { data, error } = await supabase
    .from('readings')
    .select('id, device_id, frequency_hz, confidence, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    el('readings').innerHTML = `<p class="desc">Error: ${escapeHtml(error.message)}</p>`
    return
  }

  if (!data || data.length === 0) {
    el('readings').innerHTML = '<p class="desc">No readings yet.</p>'
    return
  }

  const rows = data.map((r) => `
    <tr>
      <td>${escapeHtml(r.device_id)}</td>
      <td style="font-weight: 500;">${Math.round(r.frequency_hz).toLocaleString()} Hz</td>
      <td>${r.confidence !== null ? (Number(r.confidence) * 100).toFixed(0) + '%' : ''}</td>
      <td>${timeAgo(new Date(r.created_at))}</td>
    </tr>
  `).join('')

  el('readings').innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Device</th>
          <th>Frequency</th>
          <th>Confidence</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (sec < 60) return sec + 's ago'
  if (sec < 3600) return Math.floor(sec / 60) + 'm ago'
  if (sec < 86400) return Math.floor(sec / 3600) + 'h ago'
  return Math.floor(sec / 86400) + 'd ago'
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c])
}

async function onConnect() {
  const url = el('url').value.trim()
  const key = el('key').value.trim()
  if (!url || !key) {
    toast('URL and key required', true)
    return
  }

  el('connect').disabled = true
  el('connect').textContent = 'Connecting...'

  if (await connect(url, key)) {
    saveCreds(url, key)
    el('login').classList.add('hidden')
    el('dashboard').classList.remove('hidden')
    await Promise.all([loadConfig(), loadDevices(), loadReadings()])
  }

  el('connect').disabled = false
  el('connect').textContent = 'Connect'
}

function onLogout() {
  clearCreds()
  supabase = null
  configCache = {}
  pendingChanges = {}
  el('dashboard').classList.add('hidden')
  el('login').classList.remove('hidden')
}

el('connect').addEventListener('click', onConnect)
el('save').addEventListener('click', saveConfig)
el('refresh').addEventListener('click', async () => {
  await Promise.all([loadConfig(), loadDevices(), loadReadings()])
  toast('Refreshed')
})
el('logout').addEventListener('click', onLogout)

// Auto reconnect if we have stored creds
const stored = loadCreds()
if (stored?.url && stored?.key) {
  el('url').value = stored.url
  el('key').value = stored.key
  onConnect()
}

// Auto refresh devices and readings every 10 seconds
setInterval(() => {
  if (supabase) {
    loadDevices()
    loadReadings()
  }
}, 10000)
