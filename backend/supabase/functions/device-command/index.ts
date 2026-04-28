// Edge function: device-command
// Polled by the device to check for pending start/stop commands.
// The device calls this periodically (every few seconds) when idle.
//
// GET /device-command?deviceId=default
//   returns the most recent unacknowledged command, or null
//
// POST /device-command/ack with body { commandId: "..." }
//   marks a command as acknowledged

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const deviceAuthToken = Deno.env.get('DEVICE_AUTH_TOKEN')

const supabase = createClient(supabaseUrl, serviceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify device auth
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer /i, '').trim()
  if (deviceAuthToken && token !== deviceAuthToken) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(req.url)

  if (req.method === 'GET') {
    const deviceId = url.searchParams.get('deviceId')
    if (!deviceId) return jsonResponse({ error: 'Missing deviceId' }, 400)

    // Update last_seen
    await supabase
      .from('devices')
      .upsert(
        { id: deviceId, last_seen_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

    const { data, error } = await supabase
      .from('device_commands')
      .select('id, command, created_at')
      .eq('device_id', deviceId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return jsonResponse({ error: error.message }, 500)
    }

    return jsonResponse({ command: data || null })
  }

  if (req.method === 'POST') {
    let body
    try { body = await req.json() } catch { return jsonResponse({ error: 'Invalid JSON' }, 400) }

    const { commandId } = body
    if (!commandId) return jsonResponse({ error: 'Missing commandId' }, 400)

    const { error } = await supabase
      .from('device_commands')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', commandId)

    if (error) return jsonResponse({ error: error.message }, 500)

    return jsonResponse({ success: true })
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}
