import { useMemo } from 'react'

export default function FrequencyRing({
  value = 0,
  maxValue = 2000,
  size = 200,
  strokeWidth = 16,
  label = 'Hz',
}) {
  const { color, percentage, circumference, offset, center, radius } = useMemo(() => {
    const clampedValue = Math.max(0, Math.min(value, maxValue))
    const percentage = maxValue > 0 ? clampedValue / maxValue : 0
    const center = size / 2
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - percentage)
    const color = hzToColor(percentage)

    return { color, percentage, circumference, offset, center, radius }
  }, [value, maxValue, size, strokeWidth])

  const displayValue = Math.round(value).toLocaleString()

  return (
    <div
      className="relative inline-block"
      role="img"
      aria-label={`Current frequency ${displayValue} hertz out of ${maxValue}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease',
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span
          className="font-medium text-gray-900 tabular-nums"
          style={{ fontSize: size * 0.2 }}
        >
          {displayValue}
        </span>
        <span
          className="text-gray-400 mt-1"
          style={{ fontSize: size * 0.06 }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function hzToColor(percentage) {
  const p = Math.max(0, Math.min(1, percentage))

  if (p < 0.5) {
    const t = p * 2
    return interpolateColor([226, 75, 74], [239, 159, 39], t)
  } else {
    const t = (p - 0.5) * 2
    return interpolateColor([239, 159, 39], [99, 153, 34], t)
  }
}

function interpolateColor(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

export { hzToColor }
