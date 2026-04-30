import { createContext, useContext } from 'react'

const MonitorContext = createContext(null)

export { MonitorContext }

export function useMonitor() {
  const ctx = useContext(MonitorContext)
  if (!ctx) {
    return {
      readings: [],
      latest: null,
      isRecording: false,
      connectionStatus: 'checking',
      config: null,
      start: () => {},
      stop: () => {},
    }
  }
  return ctx
}
