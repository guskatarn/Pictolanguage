import { SentenceItem } from '../types'
import { getArasaacImageUrl } from '../utils/arasaac'
import { usePictogramImage } from '../hooks/usePictogramImage'

interface Props {
  items: SentenceItem[]
  onRemoveItem: (key: string) => void
  onClearAll: () => void
  onSpeak: () => void
  isSpeaking: boolean
}

function MiniPicto({ item, onRemove }: { item: SentenceItem; onRemove: () => void }) {
  const imageUrl = item.customImageUrl ?? (item.arasaacId !== undefined
    ? getArasaacImageUrl(item.arasaacId)
    : null)
  const { src, failed, onError } = usePictogramImage(imageUrl, item.arasaacId)

  return (
    <button
      className="sentence-item flex w-[72px] shrink-0 flex-col items-center rounded-xl border-2 border-violet-300 bg-violet-50 p-1.5"
      onClick={onRemove}
      aria-label={`Retirer ${item.word}`}
      title="Cliquer pour retirer"
    >
      <div className="sentence-item-img w-12 h-12 flex items-center justify-center bg-white rounded-lg overflow-hidden">
        {src && !failed ? (
          <img
            src={src}
            alt={item.word}
            className="w-full h-full object-contain"
            onError={onError}
          />
        ) : (
          <span className="text-2xl">🖼️</span>
        )}
      </div>
      <span className="text-xs font-bold text-violet-700 mt-1 leading-tight text-center truncate w-full">
        {item.word}
      </span>
    </button>
  )
}

export default function SentenceBar({ items, onRemoveItem, onClearAll, onSpeak, isSpeaking }: Props) {
  const isEmpty = items.length === 0

  return (
    <div className="sentence-bar bg-white border-b-2 border-violet-100 px-3 py-2 shrink-0">
      <div className="flex items-center gap-2">
        {/* Sentence scroll area */}
        <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="sentence-scroll flex gap-2 items-center min-h-[72px]">
            {isEmpty ? (
              <span className="text-gray-400 text-base italic px-2">
                Sélectionne des pictogrammes...
              </span>
            ) : (
              items.map((item) => (
                <MiniPicto key={item.key} item={item} onRemove={() => onRemoveItem(item.key)} />
              ))
            )}
          </div>
        </div>

        {/*
          Cibles tactiles : 44 px au minimum (WCAG 2.5.5), contre 28 px
          auparavant pour « Effacer » et « Tout ». En paysage sur écran bas,
          `index.css` met ces boutons en rangée plutôt que de les rétrécir :
          la barre y est même plus courte qu'avant.
        */}
        <div className="sentence-actions flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onSpeak}
            disabled={isEmpty}
            className={`flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all ${
              isSpeaking ? 'speaking-anim bg-green-600' : 'bg-green-500 active:scale-95'
            } disabled:opacity-40 disabled:pointer-events-none`}
            aria-label="Parler"
          >
            <span className="text-xl">🔊</span>
            <span>Parler</span>
          </button>
          <div className="flex flex-1 gap-1">
            <button
              onClick={() => items.length > 0 && onRemoveItem(items[items.length - 1].key)}
              disabled={isEmpty}
              className="min-h-[44px] flex-1 whitespace-nowrap bg-amber-100 text-amber-800 rounded-lg px-2 py-1.5 text-xs font-bold active:scale-95 disabled:opacity-40"
              aria-label="Effacer le dernier"
            >
              ← Effacer
            </button>
            <button
              onClick={onClearAll}
              disabled={isEmpty}
              className="min-h-[44px] flex-1 whitespace-nowrap bg-red-100 text-red-700 rounded-lg px-2 py-1.5 text-xs font-bold active:scale-95 disabled:opacity-40"
              aria-label="Tout effacer"
            >
              ✕ Tout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
