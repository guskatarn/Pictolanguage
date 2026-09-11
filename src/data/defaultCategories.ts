import { Category } from '../types'

/**
 * Onglet de la page d'accueil, toujours en tête et jamais réordonnable : c'est
 * le point de retour de l'enfant. Contrairement aux favoris, c'est une vraie
 * page — un parent peut y poser un mot ou y masquer une case.
 * `tableauTla.ts` en reprend l'identifiant pour nommer la page.
 */
export const ACCUEIL_CATEGORY: Category = {
  id: 'accueil',
  name: '🏠 Accueil',
  color: '#312E81',
  bgColor: '#E0E7FF',
  tabColor: '#4F46E5',
}

/**
 * Onglet « Favoris », toujours juste après l'accueil et jamais réordonnable.
 *
 * Il est affiché même vide : le faire apparaître au premier favori décalerait
 * toutes les autres catégories d'un cran, ce qui casserait les repères moteurs
 * que l'enfant s'est construits. Son contenu vient du profil, pas d'une liste
 * de rangement : c'est une vue (`isView`), pas une catégorie.
 */
export const FAVORITES_CATEGORY_ID = 'favoris'

export const FAVORITES_CATEGORY: Category = {
  id: FAVORITES_CATEGORY_ID,
  name: '⭐ Favoris',
  color: '#78350F',
  bgColor: '#FEF9C3',
  tabColor: '#EAB308',
  isView: true,
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'besoins',
    name: 'Besoins',
    color: '#92400E',
    bgColor: '#FEF3C7',
    tabColor: '#F59E0B',
  },
  {
    id: 'emotions',
    name: 'Émotions',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    tabColor: '#3B82F6',
  },
  {
    id: 'aliments',
    name: 'Aliments',
    color: '#14532D',
    bgColor: '#DCFCE7',
    tabColor: '#22C55E',
  },
  {
    id: 'actions',
    name: 'Actions',
    color: '#7C2D12',
    bgColor: '#FFEDD5',
    tabColor: '#F97316',
  },
  {
    id: 'lieux',
    name: 'Lieux',
    color: '#4C1D95',
    bgColor: '#EDE9FE',
    tabColor: '#8B5CF6',
  },
  {
    id: 'personnes',
    name: 'Personnes',
    color: '#831843',
    bgColor: '#FCE7F3',
    tabColor: '#EC4899',
  },
  {
    id: 'objets',
    name: 'Objets',
    color: '#1F2937',
    bgColor: '#F3F4F6',
    tabColor: '#6B7280',
  },
]

/**
 * Couleurs à appliquer à un pictogramme, d'après **sa propre** catégorie.
 *
 * Elles étaient auparavant prises sur la catégorie affichée, si bien que
 * l'onglet Favoris repeignait tout en jaune : un même mot changeait de couleur
 * selon l'endroit où l'enfant le regardait, ce qui annulait le codage
 * thématique là où il sert le plus. La couleur suit désormais le pictogramme.
 *
 * `color` est le ton foncé de la famille, le seul lisible sur `bgColor` : le
 * libellé écrit en `tabColor` (couleur de fond d'onglet) tombait entre 1,8 et
 * 4,4:1 de contraste, sous le minimum de 4,5:1, sur les huit onglets.
 */
export function getCategoryStyle(categoryId?: string) {
  const category =
    categoryId === FAVORITES_CATEGORY_ID
      ? FAVORITES_CATEGORY
      : DEFAULT_CATEGORIES.find((c) => c.id === categoryId)
  return {
    bgColor: category?.bgColor ?? '#F3F4F6',
    borderColor: category?.tabColor ?? '#6B7280',
    textColor: category?.color ?? '#1F2937',
  }
}
