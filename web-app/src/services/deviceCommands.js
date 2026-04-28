import { supabase, isSupabaseConfigured } from './supabase.js'

export async function sendDeviceCommand(command, deviceId = 'default') {
  if (!isSupabaseConfigured) {
    console.log(`[demo] would send command "${command}" to device ${deviceId}`)
    return { success: true, demo: true }
  }

  const { data, error } = await supabase
    .from('device_commands')
    .insert({
      device_id: deviceId,
      command,
      acknowledged: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to send command: ${error.message}`)
  }

  return { success: true, command: data }
}

export async function startRecording(deviceId = 'default') {
  return sendDeviceCommand('start', deviceId)
}

export async function stopRecording(deviceId = 'default') {
  return sendDeviceCommand('stop', deviceId)
}

export async function getDeviceStatus(deviceId = 'default') {
  if (!isSupabaseConfigured) {
    return { online: false, demo: true }
  }

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .maybeSingle()

  if (error) {
    console.error('[device] status check failed', error)
    return { online: false, error: error.message }
  }

  if (!data) return { online: false, registered: false }

  const lastSeen = data.last_seen_at ? new Date(data.last_seen_at) : null
  const online = lastSeen && (Date.now() - lastSeen.getTime()) < 30000

  return {
    online,
    registered: true,
    lastSeenAt: data.last_seen_at,
    firmwareVersion: data.firmware_version,
  }
}
