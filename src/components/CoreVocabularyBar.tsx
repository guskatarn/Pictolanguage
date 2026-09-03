import { PictogramEntry } from '../types'
import { getArasaacImageUrl } from '../data/defaultPictograms'
import { usePictogramImage } from '../hooks/usePictogramImage'

interface Props {
  words: PictogramEntry[]
  onClick: (picto: { key: string; word: string; arasaacId?: number; imageUrl: string; isCustom: boolean }) => void
}

function CoreWordButton({ entry, onClick }: { entry: PictogramEntry; onClick: Props['onClick'] }) {
  const imageUrl = getArasaacImageUrl(entry.id)
  const { src, failed, onError } = usePictogramImage(imageUrl, entry.id)

  return (
    <button
      className="picto-card shrink-0 flex flex-col items-center rounded-xl bg-slate-700 border-2 border-slate-600 px-1.5 py-1"
      style={{ minWidth: 60 }}
      onClick={() =>
        onClick({
          key: `core-${entry.id}`,
          word: entry.word,
          arasaacId: entry.id,
          imageUrl,
          isCustom: false,
        })
      }
      aria-label={entry.word}
    >
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg overflow-hidden">
        {failed || !src ? (
          <span className="text-lg">🖼️</span>
        ) : (
          <img
            src={src}
            alt={entry.word}
            className="w-full h-full object-contain"
            onError={onError}
            loading="lazy"
          />
        )}
      </div>
      <span className="text-[11px] font-bold text-white mt-0.5 leading-tight text-center truncate w-full">
        {entry.word}
      </span>
    </button>
  )
}

/**
 * Rangée de vocabulaire "core" toujours visible, indépendamment de la
 * catégorie active. Permet de composer des phrases spontanées (moi, veux,
 * encore, stop, oui, non...) sans changer d'onglet. Voir src/data/coreVocabulary.ts.
 */
export default function CoreVocabularyBar({ words, onClick }: Props) {
  if (words.length === 0) return null

  return (
    <div className="bg-slate-800 px-2 py-1.5 shrink-0" role="group" aria-label="Mots rapides">
      <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {words.map((entry) => (
          <CoreWordButton key={entry.id} entry={entry} onClick={onClick} />
        ))}
      </div>
    </div>
  )
}
