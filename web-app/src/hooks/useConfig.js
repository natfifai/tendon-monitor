import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabase.js'

const DEFAULT_CONFIG = {
  title: 'Tendon Monitor',
  maxHz: 2000,
  minHz: 0,
  colorLow: '#E24B4A',
  colorMid: '#EF9F27',
  colorHigh: '#639922',
  ringSize: 240,
  barCount: 5,
  readingIntervalMs: 1200,
  builderContentId: null,
  demoReadingMaxHz: 2000,
}

export function useConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    async function load() {
      const { data, error: err } = await supabase
        .from('app_config')
        .select('key, value')

      if (!active) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      const merged = { ...DEFAULT_CONFIG }
      for (const row of data || []) {
        merged[toCamelCase(row.key)] = parseValue(row.value)
      }
      setConfig(merged)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('app-config-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        () => load()
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { config, loading, error }
}

function toCamelCase(snake) {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function parseValue(value) {
  if (value === null || value === undefined) return value
  if (typeof value !== 'string') return value
  if (value === 'true') return true
  if (value === 'false') return false
  const n = Number(value)
  if (!Number.isNaN(n) && value.trim() !== '') return n
  return value
}
