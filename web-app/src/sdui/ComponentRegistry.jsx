import { Builder } from '@builder.io/react'
import FrequencyRing from '../components/FrequencyRing.jsx'
import BarChart from '../components/BarChart.jsx'
import RecordControls from '../components/RecordControls.jsx'
import StatusBar from '../components/StatusBar.jsx'
import { useMonitor } from '../context/MonitorContext.jsx'
import { isBuilderConfigured } from '../services/builderSetup.js'

function ConnectedFrequencyRing({ maxValue, size = 240, strokeWidth = 20, label = 'Hz' }) {
  const { latest, config } = useMonitor()
  return (
    <FrequencyRing
      value={latest?.frequencyHz ?? 0}
      maxValue={maxValue ?? config?.maxHz ?? 2000}
      size={size}
      strokeWidth={strokeWidth}
      label={label}
    />
  )
}

function ConnectedBarChart({ maxValue, height = 120 }) {
  const { readings, config } = useMonitor()
  return (
    <BarChart
      readings={readings}
      maxValue={maxValue ?? config?.maxHz ?? 2000}
      height={height}
    />
  )
}

function ConnectedRecordControls() {
  const { isRecording, start, stop } = useMonitor()
  return <RecordControls isRecording={isRecording} onStart={start} onStop={stop} />
}

function ConnectedStatusBar() {
  const { connectionStatus, isRecording } = useMonitor()
  return <StatusBar status={connectionStatus} isRecording={isRecording} />
}

export function registerBuilderComponents() {
  if (!isBuilderConfigured) return

  Builder.registerComponent(ConnectedFrequencyRing, {
    name: 'FrequencyRing',
    inputs: [
      { name: 'maxValue', type: 'number', defaultValue: 2000, helperText: 'Max Hz shown on the ring' },
      { name: 'size', type: 'number', defaultValue: 240, helperText: 'Diameter in pixels' },
      { name: 'strokeWidth', type: 'number', defaultValue: 20, helperText: 'Ring thickness in pixels' },
      { name: 'label', type: 'string', defaultValue: 'Hz' },
    ],
  })

  Builder.registerComponent(ConnectedBarChart, {
    name: 'BarChart',
    inputs: [
      { name: 'maxValue', type: 'number', defaultValue: 2000, helperText: 'Max Hz for bar scaling' },
      { name: 'height', type: 'number', defaultValue: 120, helperText: 'Chart height in pixels' },
    ],
  })

  Builder.registerComponent(ConnectedRecordControls, {
    name: 'RecordControls',
    inputs: [],
  })

  Builder.registerComponent(ConnectedStatusBar, {
    name: 'StatusBar',
    inputs: [],
  })
}
