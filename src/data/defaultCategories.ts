import { Category } from '../types'

/**
 * Onglet « Favoris », toujours en première position et jamais réordonnable.
 *
 * Il est affiché même vide : le faire apparaître au premier favori décalerait
 * toutes les autres catégories d'un cran, ce qui casserait les repères moteurs
 * que l'enfant s'est construits. Sa liste n'est pas une catégorie de données —
 * `pictogramIds` reste vide, le contenu venant du profil.
 */
export const FAVORITES_CATEGORY_ID = 'favoris'

export const FAVORITES_CATEGORY: Category = {
  id: FAVORITES_CATEGORY_ID,
  name: '⭐ Favoris',
  color: '#78350F',
  bgColor: '#FEF9C3',
  tabColor: '#EAB308',
  pictogramIds: [],
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'besoins',
    name: 'Besoins',
    color: '#92400E',
    bgColor: '#FEF3C7',
    tabColor: '#F59E0B',
    pictogramIds: [6456, 6061, 5921, 6479, 19524],
  },
  {
    id: 'emotions',
    name: 'Émotions',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    tabColor: '#3B82F6',
    pictogramIds: [35547, 35545, 10261, 35537, 35567],
  },
  {
    id: 'aliments',
    name: 'Aliments',
    color: '#14532D',
    bgColor: '#DCFCE7',
    tabColor: '#22C55E',
    pictogramIds: [2494, 32464, 2445, 2462, 8312],
  },
  {
    id: 'actions',
    name: 'Actions',
    color: '#7C2D12',
    bgColor: '#FFEDD5',
    tabColor: '#F97316',
    pictogramIds: [5441, 8142, 23392, 6564, 6572],
  },
  {
    id: 'lieux',
    name: 'Lieux',
    color: '#4C1D95',
    bgColor: '#EDE9FE',
    tabColor: '#8B5CF6',
    pictogramIds: [3082, 6964, 2859, 6930, 10752],
  },
  {
    id: 'personnes',
    name: 'Personnes',
    color: '#831843',
    bgColor: '#FCE7F3',
    tabColor: '#EC4899',
    pictogramIds: [2458, 31146, 25790, 6556, 6632],
  },
  {
    id: 'objets',
    name: 'Objets',
    color: '#1F2937',
    bgColor: '#F3F4F6',
    tabColor: '#6B7280',
    pictogramIds: [25191, 9813, 26479, 28099, 2339],
  },
]
