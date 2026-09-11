import { TailleCase } from '../types'

/**
 * Taille du libellé et des marges d'une case, la vignette remplissant ce qui
 * reste. La géométrie de la grille appartient au tableau : c'est la **case**
 * qui grandit avec ce réglage, et la grille défile quand elle ne tient plus à
 * l'écran, plutôt que de se reformer sur moins de colonnes.
 *
 * Partagée par les cases de mot et de navigation : deux cases voisines dont
 * le libellé n'aurait pas la même taille désaligneraient la rangée.
 */
export const STYLE_TAILLE: Record<TailleCase, { text: string; padding: string; emoji: string }> = {
  // L'emoji d'une case de navigation est pris un cran au-dessus de ce que
  // suggère la taille de texte : à 36 px, il paraissait perdu dans une vignette
  // qu'un pictogramme remplit, et la case semblait à moitié vide.
  S: { text: 'text-xs', padding: 'p-1.5', emoji: 'text-4xl' },
  M: { text: 'text-sm', padding: 'p-2', emoji: 'text-5xl' },
  L: { text: 'text-base', padding: 'p-2.5', emoji: 'text-6xl' },
}
