import { Case, Geometrie, Page, RefSlot } from '../types'

/**
 * Construction et adressage des pages.
 *
 * Toutes les fonctions sont pures et sans dépendance à React : ce sont elles
 * qui portent l'invariant de positions stables, et elles doivent pouvoir se
 * vérifier sans monter le moindre composant.
 */

const SEPARATEUR = '#'

export function nombreDeSlots(geometrie: Geometrie): number {
  return geometrie.colonnes * geometrie.lignes
}

/** Adresse absolue d'une case : `"besoins#7"`. */
export function refSlot(pageId: string, index: number): RefSlot {
  return `${pageId}${SEPARATEUR}${index}`
}

/**
 * `null` pour une adresse illisible — une référence peut survivre en
 * `localStorage` à la page qui la portait, et une donnée d'hier ne doit jamais
 * faire tomber l'application d'aujourd'hui.
 */
export function lireRefSlot(ref: RefSlot): { pageId: string; index: number } | null {
  const coupure = ref.lastIndexOf(SEPARATEUR)
  if (coupure <= 0 || coupure === ref.length - 1) return null
  const index = Number(ref.slice(coupure + 1))
  if (!Number.isInteger(index) || index < 0) return null
  return { pageId: ref.slice(0, coupure), index }
}

export function indexDepuis(geometrie: Geometrie, ligne: number, colonne: number): number {
  return ligne * geometrie.colonnes + colonne
}

export function positionDe(geometrie: Geometrie, index: number): { ligne: number; colonne: number } {
  return {
    ligne: Math.floor(index / geometrie.colonnes),
    colonne: index % geometrie.colonnes,
  }
}

export interface SpecPage {
  id: string
  titre: string
  geometrie: Geometrie
  /**
   * Cases posées **en creux**, indexées par position. Écrire les trente slots
   * d'une page à la main, `null` compris, se corrompt au premier copier-coller
   * et se relit mal ; la forme dense est produite ici.
   */
  cases: Record<number, Case>
  theme?: string
}

/**
 * Matérialise une page : forme creuse à l'écriture, tableau dense à l'exécution.
 *
 * Lève plutôt que de corriger en silence. Ces pages sont écrites dans le code,
 * pas saisies par un utilisateur : une position hors grille est une faute de
 * frappe du développeur, que la suite de tests doit faire éclater au grand jour
 * plutôt que de laisser filer une case invisible en production.
 */
export function construirePage({ id, titre, geometrie, cases, theme }: SpecPage): Page {
  if (id.includes(SEPARATEUR)) {
    throw new Error(`Identifiant de page invalide : « ${id} » contient « ${SEPARATEUR} ».`)
  }

  const total = nombreDeSlots(geometrie)
  const slots: (Case | null)[] = new Array(total).fill(null)

  for (const [cle, contenu] of Object.entries(cases)) {
    const index = Number(cle)
    if (!Number.isInteger(index) || index < 0 || index >= total) {
      throw new Error(
        `Page « ${id} » : position ${cle} hors de la grille ${geometrie.colonnes}×${geometrie.lignes} (0 à ${total - 1}).`,
      )
    }
    slots[index] = contenu
  }

  return { id, titre, slots, ...(theme ? { theme } : {}) }
}

/**
 * Écrit une page rangée par rangée, telle qu'elle s'affichera : `null` marque
 * une case libre. Pour une page dense, c'est la seule forme qui se relit — une
 * orthophoniste doit y voir la grille, pas une liste d'index à recompter.
 *
 * Lève sur une rangée trop longue : elle déborderait sur la suivante sans
 * autre signe, et tout ce qui suit glisserait d'autant.
 */
export function casesEnRangees(
  geometrie: Geometrie,
  rangees: (Case | null)[][],
): Record<number, Case> {
  const cases: Record<number, Case> = {}
  rangees.forEach((rangee, ligne) => {
    if (rangee.length > geometrie.colonnes) {
      throw new Error(
        `Rangée ${ligne} : ${rangee.length} cases pour ${geometrie.colonnes} colonnes.`,
      )
    }
    rangee.forEach((contenu, colonne) => {
      if (contenu) cases[indexDepuis(geometrie, ligne, colonne)] = contenu
    })
  })
  return cases
}

/**
 * Première case libre d'une page, en tenant compte des mots que le profil y a
 * déjà posés. `null` si la page est pleine.
 *
 * Parcours dans l'ordre des index, donc déterministe : deux appareils qui
 * ajoutent le même mot au même tableau lui donnent la même place.
 */
export function premierSlotLibre(page: Page, occupes: Iterable<RefSlot> = []): RefSlot | null {
  const pris = new Set(occupes)
  for (let index = 0; index < page.slots.length; index += 1) {
    if (page.slots[index] === null && !pris.has(refSlot(page.id, index))) {
      return refSlot(page.id, index)
    }
  }
  return null
}
