import { EntreeLexique, Page, UserProfile } from '../types'
import { trouverMot } from '../data/lexique'
import { refSlot } from './pages'

/** Mot occupant une case, et d'où il vient. */
export interface MotPose {
  entree: EntreeLexique
  /** Ajouté par le parent (calque du profil) plutôt que livré par le tableau. */
  isCustom: boolean
}

/**
 * Résout le contenu d'une case : le mot que le tableau y a posé, ou celui que
 * le profil y a ajouté. `undefined` pour une case réellement vide.
 *
 * Partagé entre la grille et l'écran de réglages : les deux doivent voir
 * exactement le même vocabulaire, sans quoi un parent pourrait décocher une
 * case qui n'est pas celle qu'il croit.
 */
export function motDeLaCase(
  page: Page,
  index: number,
  profile: UserProfile | null,
): MotPose | undefined {
  const slot = page.slots[index]

  if (slot?.type === 'vocabulaire') {
    const entree = trouverMot(slot.lexiqueId)
    return entree ? { entree, isCustom: false } : undefined
  }
  // Les cases de navigation et de commande ne portent pas de mot : elles ne
  // rejoignent pas la phrase et ne se masquent pas comme du vocabulaire.
  if (slot) return undefined

  const lexiqueId = profile?.placements[refSlot(page.id, index)]
  if (!lexiqueId) return undefined
  const entree = profile?.lexiquePerso.find((e) => e.id === lexiqueId)
  return entree ? { entree, isCustom: true } : undefined
}

/** Cases occupées d'une page, dans l'ordre des index. */
export function motsDeLaPage(
  page: Page,
  profile: UserProfile | null,
): { index: number; ref: string; mot: MotPose }[] {
  const poses: { index: number; ref: string; mot: MotPose }[] = []
  for (let index = 0; index < page.slots.length; index += 1) {
    const mot = motDeLaCase(page, index, profile)
    if (mot) poses.push({ index, ref: refSlot(page.id, index), mot })
  }
  return poses
}
