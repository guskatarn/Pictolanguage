import { PictogramItem, PictogramSize } from '../types'
import { usePictogramImage } from '../hooks/usePictogramImage'
import { getCategoryStyle } from '../data/defaultCategories'

interface Props {
  picto: PictogramItem
  size: PictogramSize
  onClick: (picto: PictogramItem) => void
  onToggleFavorite: (picto: PictogramItem) => void
  /** Retirée hors mode parent : l'enfant ne doit pas pouvoir la toucher. */
  showFavorite?: boolean
}

const sizeMap: Record<PictogramSize, { img: number; text: string; padding: string }> = {
  S: { img: 80, text: 'text-xs', padding: 'p-1.5' },
  M: { img: 110, text: 'text-sm', padding: 'p-2' },
  L: { img: 140, text: 'text-base', padding: 'p-2.5' },
}

export default function PictogramCard({
  picto,
  size,
  onClick,
  onToggleFavorite,
  showFavorite = true,
}: Props) {
  const { src, failed, onError } = usePictogramImage(picto.imageUrl, picto.arasaacId)
  const s = sizeMap[size]
  // Les couleurs viennent de la catégorie du pictogramme, pas de l'onglet
  // affiché : un mot garde la même couleur partout, y compris dans les favoris.
  const { bgColor, borderColor, textColor } = getCategoryStyle(picto.categoryId)

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
        {/*
          La vignette suit la largeur de sa colonne, plafonnée à la taille
          choisie : le nombre de colonnes étant désormais fixe, une taille en
          pixels durs déborderait sur un écran étroit.
        */}
        <div
          className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white"
          style={{ maxWidth: s.img, maxHeight: s.img }}
        >
          {failed || !src ? (
            <span style={{ fontSize: s.img * 0.45 }}>🖼️</span>
          ) : (
            <img
              src={src}
              alt={picto.word}
              className="h-full w-full object-contain"
              onError={onError}
              loading="lazy"
            />
          )}
        </div>
        {/*
          Le libellé est écrit dans le ton foncé de la catégorie, pas dans sa
          couleur d'onglet : celle-ci, prévue pour un fond d'onglet, tombait
          entre 1,8 et 4,4:1 de contraste sur le fond clair de la carte, sous
          le minimum de 4,5:1 — sur les huit onglets.
        */}
        <span
          className={`${s.text} font-bold mt-1.5 text-center leading-tight`}
          style={{ color: textColor, maxWidth: '100%', wordBreak: 'break-word' }}
        >
          {picto.word}
        </span>
      </button>

      {/*
        L'étoile inactive reste discrète : cinq étoiles pleinement visibles
        alourdiraient une grille destinée à un public sensible à la surcharge
        visuelle. Seuls les favoris ressortent vraiment. Elle disparaît
        entièrement quand le verrou parental est posé.
      */}
      {showFavorite && (
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
      )}
    </div>
  )
}
