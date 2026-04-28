import { useMemo } from 'react'
import { hzToColor } from './FrequencyRing.jsx'

export default function BarChart({ readings = [], maxValue = 2000, height = 120 }) {
  const bars = useMemo(() => {
    const filled = [...readings]
    while (filled.length < 5) filled.unshift(null)
    return filled.slice(-5).map((reading, i) => {
      if (!reading) {
        return { key: `empty-${i}`, value: null, heightPx: 4, color: '#F3F4F6', label: '' }
      }
      const pct = Math.max(0, Math.min(reading.frequencyHz / maxValue, 1))
      return {
        key: reading.id ?? `reading-${i}`,
        value: reading.frequencyHz,
        heightPx: Math.max(4, pct * height),
        color: hzToColor(pct),
        label: formatTime(reading.createdAt),
      }
    })
  }, [readings, maxValue, height])

  return (
    <div className="flex items-end justify-between gap-2 px-2" style={{ height }}>
      {bars.map((bar) => (
        <div key={bar.key} className="flex-1 flex flex-col items-center">
          <div className="flex-1 flex items-end w-full">
            <div
              className="w-full rounded-md"
              style={{
                height: `${bar.heightPx}px`,
                background: bar.color,
                transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
              }}
              title={bar.value !== null ? `${bar.value} Hz` : 'No reading'}
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 tabular-nums">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
