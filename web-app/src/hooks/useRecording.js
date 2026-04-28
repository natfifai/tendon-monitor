import { useCallback, useState } from 'react'
import { startRecording, stopRecording } from '../services/deviceCommands.js'
import { isSupabaseConfigured } from '../services/supabase.js'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !isSupabaseConfigured

export function useRecording({ onStartDemo, onStopDemo } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const start = useCallback(async () => {
    if (isRecording || busy) return
    setBusy(true)
    setError(null)

    try {
      if (DEMO_MODE) {
        onStartDemo?.()
      } else {
        await startRecording()
      }
      setIsRecording(true)
    } catch (e) {
      setError(e.message || 'Failed to start recording')
    } finally {
      setBusy(false)
    }
  }, [isRecording, busy, onStartDemo])

  const stop = useCallback(async () => {
    if (!isRecording || busy) return
    setBusy(true)
    setError(null)

    try {
      if (DEMO_MODE) {
        onStopDemo?.()
      } else {
        await stopRecording()
      }
      setIsRecording(false)
    } catch (e) {
      setError(e.message || 'Failed to stop recording')
    } finally {
      setBusy(false)
    }
  }, [isRecording, busy, onStopDemo])

  return {
    isRecording,
    busy,
    error,
    start,
    stop,
    isDemoMode: DEMO_MODE,
  }
}
