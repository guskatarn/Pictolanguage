import { useRef } from 'react'
import { PictogramItem, ProfileSettings, TailleCase } from '../types'
import { usePictogramImage } from '../hooks/usePictogramImage'
import { getStyleCase } from '../data/classesGrammaticales'
import { STYLE_TAILLE } from './tailleCase'

interface Props {
  picto: PictogramItem
  size: TailleCase
  /** Codage couleur choisi par le parent : grammatical ou thématique. */
  modeCouleur: ProfileSettings['modeCouleur']
  onClick: (picto: PictogramItem) => void
  onToggleFavorite: (picto: PictogramItem) => void
  /** Retirée hors mode parent : l'enfant ne doit pas pouvoir la toucher. */
  showFavorite?: boolean
  /**
   * Mode modélisation : la case s'illumine quand l'adulte la touche, pour que
   * l'enfant voie *où* se trouve le mot qu'il entend.
   */
  illuminer?: boolean
}

/**
 * Halo qui s'élargit puis s'efface, sans mouvement de la carte : un zoom se
 * superposerait à l'enfoncement de `.picto-card:active`. Joué par l'API Web
 * Animations plutôt que par une classe CSS, pour repartir de zéro à chaque
 * appui — l'adulte touche souvent deux fois de suite le même mot.
 */
const ILLUMINATION: Keyframe[] = [
  { boxShadow: '0 0 0 0 rgba(13, 148, 136, 0.95)', outline: '4px solid #0D9488' },
  { boxShadow: '0 0 0 18px rgba(13, 148, 136, 0)', outline: '4px solid rgba(13, 148, 136, 0)' },
]

export default function PictogramCard({
  picto,
  size,
  modeCouleur,
  onClick,
  onToggleFavorite,
  showFavorite = true,
  illuminer = false,
}: Props) {
  const bouton = useRef<HTMLButtonElement>(null)
  const { src, failed, onError } = usePictogramImage(picto.imageUrl, picto.arasaacId)
  const s = STYLE_TAILLE[size]
  // Les couleurs viennent d'une propriété du pictogramme — sa classe
  // grammaticale ou son thème selon le mode —, jamais de la page affichée : un
  // mot garde la même couleur partout, y compris dans les favoris.
  const { bgColor, borderColor, textColor } = getStyleCase(picto, modeCouleur)

  return (
    // L'étoile est un frère du bouton principal, pas un enfant : un bouton
    // imbriqué dans un bouton est invalide et se comporte mal au clavier.
    // `h-full` sur la carte comme sur le bouton : les rangées de la grille ont
    // une hauteur fixe (voir `index.css`), et une carte qui la dépasserait
    // déborderait sur sa voisine du dessous.
    <div className="relative h-full w-full">
      <button
        ref={bouton}
        className={`picto-card flex h-full w-full flex-col items-center rounded-2xl border-2 ${s.padding}`}
        style={{ backgroundColor: bgColor, borderColor }}
        onClick={() => {
          // `animate` manque à jsdom et à de très vieilles WebView : sans lui,
          // le mot est dit quand même, seul le halo manque.
          if (illuminer) bouton.current?.animate?.(ILLUMINATION, { duration: 900, easing: 'ease-out' })
          onClick(picto)
        }}
        aria-label={picto.word}
      >
        {/*
          La vignette prend la hauteur qui reste une fois le libellé placé,
          plutôt qu'un carré strict : la case a une hauteur imposée, et un
          `aspect-square` la ferait déborder dès que le libellé passe sur deux
          lignes.
        */}
        <div className="flex w-full min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-white">
          {failed || !src ? (
            <span className="text-4xl">🖼️</span>
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
          className={`${s.text} mt-1 w-full shrink-0 truncate text-center font-bold leading-tight`}
          style={{ color: textColor }}
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
