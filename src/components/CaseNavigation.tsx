import { CSSProperties } from 'react'
import { CaseGrille, ProfileSettings, TailleCase } from '../types'
import { getStyleNavigation } from '../data/classesGrammaticales'
import { STYLE_TAILLE } from './tailleCase'

interface Props {
  navigation: Extract<CaseGrille, { type: 'navigation' }>
  size: TailleCase
  modeCouleur: ProfileSettings['modeCouleur']
  onOuvrir: (pageId: string) => void
}

/**
 * Case qui ouvre une page au lieu d'ajouter un mot à la phrase.
 *
 * Elle occupe une place fixe dans la grille, comme un mot : l'enfant apprend
 * où se trouve « Aliments » de la même façon qu'il apprend où se trouve
 * « manger ». Deux marques la distinguent d'un mot sans rien à lire — l'emoji
 * à la place du pictogramme, et le coin replié (`case-navigation` dans
 * `index.css`), convention des tableaux de langage assisté du commerce.
 *
 * Pas d'étoile de favori : une page n'est pas un mot, elle n'entrerait pas
 * dans une phrase.
 */
export default function CaseNavigation({ navigation, size, modeCouleur, onOuvrir }: Props) {
  const s = STYLE_TAILLE[size]
  const { bgColor, borderColor, textColor } = getStyleNavigation(navigation.pageCible, modeCouleur)

  return (
    <button
      className={`picto-card case-navigation relative flex h-full w-full flex-col items-center rounded-2xl rounded-tr-none border-2 ${s.padding}`}
      style={{ backgroundColor: bgColor, borderColor, '--bordure': borderColor } as CSSProperties}
      onClick={() => onOuvrir(navigation.pageCible)}
      aria-label={`Ouvrir la page ${navigation.libelle}`}
    >
      <span
        className={`flex w-full min-h-0 flex-1 items-center justify-center rounded-xl bg-white ${s.emoji}`}
        aria-hidden="true"
      >
        {navigation.emoji}
      </span>
      <span
        className={`${s.text} mt-1 w-full shrink-0 truncate text-center font-bold leading-tight`}
        style={{ color: textColor }}
      >
        {navigation.libelle}
      </span>
    </button>
  )
}
