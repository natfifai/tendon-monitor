import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabase.js'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !isSupabaseConfigured

export function useReadings({ limit = 5, deviceId = 'default' } = {}) {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const demoIntervalRef = useRef(null)

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false)
      return
    }

    let active = true

    async function loadInitial() {
      const { data, error: err } = await supabase
        .from('readings')
        .select('id, frequency_hz, created_at, device_id, confidence')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!active) return

      if (err) {
        setError(err.message)
      } else {
        setReadings((data || []).map(normalizeReading).reverse())
      }
      setLoading(false)
    }

    loadInitial()

    const channel = supabase
      .channel(`readings-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setReadings((prev) => {
            const next = [...prev, normalizeReading(payload.new)]
            return next.slice(-limit)
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [limit, deviceId])

  function addDemoReading(value) {
    const reading = {
      id: `demo-${Date.now()}`,
      frequencyHz: value,
      createdAt: new Date().toISOString(),
      deviceId,
      confidence: 0.85,
    }
    setReadings((prev) => [...prev, reading].slice(-limit))
  }

  function startDemo(maxHz = 2000) {
    if (demoIntervalRef.current) return
    demoIntervalRef.current = setInterval(() => {
      const hz = Math.round(Math.random() * maxHz)
      addDemoReading(hz)
    }, 1200)
  }

  function stopDemo() {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current)
      demoIntervalRef.current = null
    }
  }

  useEffect(() => () => stopDemo(), [])

  const latest = readings.length > 0 ? readings[readings.length - 1] : null

  return {
    readings,
    latest,
    loading,
    error,
    isDemoMode: DEMO_MODE,
    startDemo,
    stopDemo,
  }
}

function normalizeReading(row) {
  return {
    id: row.id,
    frequencyHz: Number(row.frequency_hz ?? row.frequencyHz ?? 0),
    createdAt: row.created_at ?? row.createdAt,
    deviceId: row.device_id ?? row.deviceId,
    confidence: row.confidence,
  }
}
