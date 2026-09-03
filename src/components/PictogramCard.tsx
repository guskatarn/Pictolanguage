import { PictogramItem, PictogramSize } from '../types'
import { usePictogramImage } from '../hooks/usePictogramImage'

interface Props {
  picto: PictogramItem
  size: PictogramSize
  bgColor: string
  borderColor: string
  onClick: (picto: PictogramItem) => void
  onToggleFavorite: (picto: PictogramItem) => void
}

const sizeMap: Record<PictogramSize, { img: number; text: string; padding: string }> = {
  S: { img: 80, text: 'text-xs', padding: 'p-1.5' },
  M: { img: 110, text: 'text-sm', padding: 'p-2' },
  L: { img: 140, text: 'text-base', padding: 'p-2.5' },
}

export default function PictogramCard({
  picto,
  size,
  bgColor,
  borderColor,
  onClick,
  onToggleFavorite,
}: Props) {
  const { src, failed, onError } = usePictogramImage(picto.imageUrl, picto.arasaacId)
  const s = sizeMap[size]

  return (
    // L'étoile est un frère du bouton principal, pas un enfant : un bouton
    // imbriqué dans un bouton est invalide et se comporte mal au clavier.
    <div className="relative w-full">
      <button
        className={`picto-card flex flex-col items-center rounded-2xl border-2 w-full ${s.padding}`}
        style={{ backgroundColor: bgColor, borderColor }}
        onClick={() => onClick(picto)}
        aria-label={picto.word}
      >
        <div
          className="flex items-center justify-center rounded-xl overflow-hidden bg-white"
          style={{ width: s.img, height: s.img, minWidth: s.img, minHeight: s.img }}
        >
          {failed || !src ? (
            <span style={{ fontSize: s.img * 0.45 }}>🖼️</span>
          ) : (
            <img
              src={src}
              alt={picto.word}
              width={s.img}
              height={s.img}
              className="object-contain"
              onError={onError}
              loading="lazy"
            />
          )}
        </div>
        <span
          className={`${s.text} font-bold mt-1.5 text-center leading-tight`}
          style={{ color: borderColor, maxWidth: s.img + 8, wordBreak: 'break-word' }}
        >
          {picto.word}
        </span>
      </button>

      {/*
        L'étoile inactive reste discrète : cinq étoiles pleinement visibles
        alourdiraient une grille destinée à un public sensible à la surcharge
        visuelle. Seuls les favoris ressortent vraiment.
      */}
      <button
        type="button"
        onClick={() => onToggleFavorite(picto)}
        className={`absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform active:scale-90 ${
          picto.isFavorite
            ? 'bg-white/90 text-amber-500 shadow-sm'
            : 'text-gray-400/60'
        }`}
        aria-label={
          picto.isFavorite
            ? `Retirer ${picto.word} des favoris`
            : `Ajouter ${picto.word} aux favoris`
        }
        aria-pressed={picto.isFavorite}
      >
        <span aria-hidden="true">{picto.isFavorite ? '⭐' : '☆'}</span>
      </button>
    </div>
  )
}
