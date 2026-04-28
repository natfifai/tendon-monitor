import { useEffect, useState } from 'react'
import FrequencyRing from './components/FrequencyRing.jsx'
import BarChart from './components/BarChart.jsx'
import RecordControls from './components/RecordControls.jsx'
import StatusBar from './components/StatusBar.jsx'
import LayoutRenderer from './sdui/LayoutRenderer.jsx'
import { useReadings } from './hooks/useReadings.js'
import { useRecording } from './hooks/useRecording.js'
import { useConfig } from './hooks/useConfig.js'

const USE_BUILDER_LAYOUT = true

export default function App() {
  const { config, loading: configLoading, error: configError } = useConfig()
  const {
    readings,
    latest,
    loading: readingsLoading,
    isDemoMode,
    startDemo,
    stopDemo,
  } = useReadings({ limit: 5 })
  const { isRecording, start, stop, error: recordError } = useRecording({
    onStartDemo: () => startDemo(config?.demoReadingMaxHz ?? 2000),
    onStopDemo: stopDemo,
  })
  const [connectionStatus, setConnectionStatus] = useState('checking')

  useEffect(() => {
    if (isDemoMode) {
      setConnectionStatus('online')
    } else if (configError) {
      setConnectionStatus('offline')
    } else if (configLoading || readingsLoading) {
      setConnectionStatus('checking')
    } else {
      setConnectionStatus('online')
    }
  }, [configError, configLoading, readingsLoading, isDemoMode])

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (USE_BUILDER_LAYOUT && config?.builderContentId) {
    return (
      <LayoutRenderer
        contentId={config.builderContentId}
        fallback={
          <DefaultLayout
            config={config}
            readings={readings}
            latest={latest}
            isRecording={isRecording}
            onStart={start}
            onStop={stop}
            connectionStatus={connectionStatus}
            recordError={recordError}
          />
        }
      />
    )
  }

  return (
    <DefaultLayout
      config={config}
      readings={readings}
      latest={latest}
      isRecording={isRecording}
      onStart={start}
      onStop={stop}
      connectionStatus={connectionStatus}
      recordError={recordError}
    />
  )
}

function DefaultLayout({
  config,
  readings,
  latest,
  isRecording,
  onStart,
  onStop,
  connectionStatus,
  recordError,
}) {
  const maxHz = config?.maxHz ?? 2000

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StatusBar status={connectionStatus} isRecording={isRecording} />

      <div className="flex-1 flex flex-col px-6 py-4">
        <div className="flex flex-col items-center pt-6">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
            {config?.title ?? 'Tendon Monitor'}
          </p>
          <FrequencyRing
            value={latest?.frequencyHz ?? 0}
            maxValue={maxHz}
            size={240}
            strokeWidth={20}
          />
        </div>

        <div className="mt-10">
          <p className="text-xs text-gray-500 text-center mb-3">
            Last 5 readings
          </p>
          <BarChart readings={readings} maxValue={maxHz} />
        </div>

        <div className="flex-1" />

        {recordError && (
          <p className="text-xs text-red-600 text-center mb-2">
            {recordError}
          </p>
        )}

        <RecordControls
          isRecording={isRecording}
          onStart={onStart}
          onStop={onStop}
        />
      </div>
    </div>
  )
}
