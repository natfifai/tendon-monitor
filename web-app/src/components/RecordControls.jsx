export default function RecordControls({ isRecording, onStart, onStop }) {
  return (
    <div className="flex gap-3 pb-2">
      <button
        onClick={onStart}
        disabled={isRecording}
        className={`flex-1 py-4 rounded-xl font-medium text-sm transition-all ${
          isRecording
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-50 text-red-700 border border-red-200 active:scale-95'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRecording ? 'bg-gray-300' : 'bg-red-500'
            }`}
          />
          Record
        </span>
      </button>
      <button
        onClick={onStop}
        disabled={!isRecording}
        className={`flex-1 py-4 rounded-xl font-medium text-sm transition-all ${
          !isRecording
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white active:scale-95'
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-sm ${
              !isRecording ? 'bg-gray-300' : 'bg-white'
            }`}
          />
          Stop
        </span>
      </button>
    </div>
  )
}
