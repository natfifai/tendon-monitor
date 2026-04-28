export default function StatusBar({ status, isRecording }) {
  const statusInfo = {
    online: { color: 'bg-green-500', label: 'Connected' },
    offline: { color: 'bg-red-500', label: 'Offline' },
    checking: { color: 'bg-amber-400', label: 'Connecting' },
  }[status] ?? { color: 'bg-gray-400', label: 'Unknown' }

  return (
    <div className="w-full px-6 pt-3 pb-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
        <span className="text-[11px] text-gray-500 uppercase tracking-wide">
          {statusInfo.label}
        </span>
      </div>
      {isRecording && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] text-red-600 uppercase tracking-wide">
            Recording
          </span>
        </div>
      )}
    </div>
  )
}
