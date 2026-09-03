import { HistoryEntry } from '../types'

interface Props {
  history: HistoryEntry[]
  onReplay: (words: string[]) => void
  onClose: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function HistoryPanel({ history, onReplay, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-violet-600 text-white shrink-0">
          <h2 className="text-lg font-bold">📜 Historique</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <span className="text-4xl mb-2">📭</span>
              <span>Aucune phrase encore</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                    </p>
                    <p className="text-sm font-bold text-gray-800 leading-snug">
                      {entry.words.join(' · ')}
                    </p>
                  </div>
                  <button
                    onClick={() => onReplay(entry.words)}
                    className="shrink-0 bg-violet-500 text-white rounded-lg px-3 py-1.5 text-sm font-bold active:scale-95 flex items-center gap-1"
                    aria-label="Rejouer"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
