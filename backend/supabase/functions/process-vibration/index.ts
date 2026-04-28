// Edge function: process-vibration
// Receives raw vibration data from the device, calls the AI classifier,
// stores the resulting frequency reading in the database.
//
// Called by the hardware device via HTTPS POST.
//
// Request body:
// {
//   "deviceId": "default",
//   "samples": [0.12, 0.34, ...] or base64 encoded audio,
//   "sampleRateHz": 2000,
//   "deviceTimestamp": "2025-01-01T00:00:00Z"
// }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const classifierUrl = Deno.env.get('CLASSIFIER_URL')
const classifierKey = Deno.env.get('CLASSIFIER_API_KEY')
const deviceAuthToken = Deno.env.get('DEVICE_AUTH_TOKEN')

const supabase = createClient(supabaseUrl, serviceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Verify device auth token
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer /i, '').trim()
  if (deviceAuthToken && token !== deviceAuthToken) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const { deviceId, samples, sampleRateHz, deviceTimestamp } = body
  if (!deviceId) {
    return jsonResponse({ error: 'Missing deviceId' }, 400)
  }
  if (!Array.isArray(samples) && typeof samples !== 'string') {
    return jsonResponse({ error: 'Missing or invalid samples' }, 400)
  }

  // Update last_seen for the device
  await supabase
    .from('devices')
    .upsert(
      { id: deviceId, last_seen_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  // Classify
  let frequencyHz, confidence
  try {
    const result = await classify({ samples, sampleRateHz })
    frequencyHz = result.frequencyHz
    confidence = result.confidence
  } catch (e) {
    console.error('[classify] failed', e)
    return jsonResponse({ error: 'Classification failed', detail: e.message }, 502)
  }

  // Store reading
  const { data: reading, error } = await supabase
    .from('readings')
    .insert({
      device_id: deviceId,
      frequency_hz: frequencyHz,
      confidence,
      raw_data: {
        sample_count: Array.isArray(samples) ? samples.length : null,
        sample_rate_hz: sampleRateHz,
        device_timestamp: deviceTimestamp,
      },
    })
    .select()
    .single()

  if (error) {
    console.error('[db] insert failed', error)
    return jsonResponse({ error: 'Failed to store reading', detail: error.message }, 500)
  }

  return jsonResponse({
    success: true,
    reading: {
      id: reading.id,
      frequencyHz,
      confidence,
      createdAt: reading.created_at,
    },
  })
})

async function classify({ samples, sampleRateHz }) {
  if (!classifierUrl) {
    // Fallback: simple FFT approximation if no external classifier is configured
    return naiveFFT(samples, sampleRateHz)
  }

  const resp = await fetch(classifierUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(classifierKey ? { 'Authorization': `Bearer ${classifierKey}` } : {}),
    },
    body: JSON.stringify({ samples, sampleRateHz }),
  })

  if (!resp.ok) {
    throw new Error(`Classifier returned ${resp.status}`)
  }

  const data = await resp.json()
  return {
    frequencyHz: Math.max(0, Math.min(Number(data.frequencyHz), 999999)),
    confidence: data.confidence !== undefined ? Number(data.confidence) : null,
  }
}

// Fallback: find the dominant frequency via simple autocorrelation
// Used only if no external classifier is configured. Replace with
// your actual AI model endpoint via CLASSIFIER_URL.
function naiveFFT(samples, sampleRateHz) {
  if (!Array.isArray(samples) || samples.length < 4 || !sampleRateHz) {
    return { frequencyHz: 0, confidence: 0 }
  }

  let maxCorr = 0
  let bestLag = 1
  const maxLag = Math.min(samples.length / 2, 500)

  for (let lag = 1; lag < maxLag; lag++) {
    let corr = 0
    for (let i = 0; i < samples.length - lag; i++) {
      corr += samples[i] * samples[i + lag]
    }
    if (corr > maxCorr) {
      maxCorr = corr
      bestLag = lag
    }
  }

  const frequencyHz = sampleRateHz / bestLag
  return {
    frequencyHz: Math.max(0, Math.min(frequencyHz, 999999)),
    confidence: 0.5,
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
