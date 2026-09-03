import { PictogramEntry } from '../types'

export const DEFAULT_PICTOGRAMS: PictogramEntry[] = [
  // Besoins
  { id: 6456,  word: 'manger',        categoryId: 'besoins' },
  { id: 6061,  word: 'boire',         categoryId: 'besoins' },
  { id: 5921,  word: 'toilettes',     categoryId: 'besoins' },
  { id: 6479,  word: 'dormir',        categoryId: 'besoins' },
  { id: 19524, word: 'aide',          categoryId: 'besoins' },
  // Émotions
  { id: 35547, word: 'content',       categoryId: 'emotions' },
  { id: 35545, word: 'triste',        categoryId: 'emotions' },
  { id: 10261, word: 'peur',          categoryId: 'emotions' },
  { id: 35537, word: 'fatigué',       categoryId: 'emotions' },
  { id: 35567, word: 'colère',        categoryId: 'emotions' },
  // Aliments
  { id: 2494,  word: 'pain',          categoryId: 'aliments' },
  { id: 32464, word: 'eau',           categoryId: 'aliments' },
  { id: 2445,  word: 'lait',          categoryId: 'aliments' },
  { id: 2462,  word: 'pomme',         categoryId: 'aliments' },
  { id: 8312,  word: 'biscuit',       categoryId: 'aliments' },
  // Actions
  { id: 5441,  word: 'vouloir',       categoryId: 'actions' },
  { id: 8142,  word: 'aller',         categoryId: 'actions' },
  { id: 23392, word: 'jouer',         categoryId: 'actions' },
  { id: 6564,  word: 'regarder',      categoryId: 'actions' },
  { id: 6572,  word: 'écouter',       categoryId: 'actions' },
  // Lieux
  { id: 3082,  word: 'école',         categoryId: 'lieux' },
  { id: 6964,  word: 'maison',        categoryId: 'lieux' },
  { id: 2859,  word: 'parc',          categoryId: 'lieux' },
  { id: 6930,  word: 'salle de bain', categoryId: 'lieux' },
  { id: 10752, word: 'cuisine',       categoryId: 'lieux' },
  // Personnes
  { id: 2458,  word: 'maman',         categoryId: 'personnes' },
  { id: 31146, word: 'papa',          categoryId: 'personnes' },
  { id: 25790, word: 'ami',           categoryId: 'personnes' },
  { id: 6556,  word: 'professeur',    categoryId: 'personnes' },
  { id: 6632,  word: 'moi',           categoryId: 'personnes' },
  // Objets
  { id: 25191, word: 'livre',         categoryId: 'objets' },
  { id: 9813,  word: 'jouet',         categoryId: 'objets' },
  { id: 26479, word: 'téléphone',     categoryId: 'objets' },
  { id: 28099, word: 'tablette',      categoryId: 'objets' },
  { id: 2339,  word: 'voiture',       categoryId: 'objets' },
]

export function getArasaacImageUrl(id: number): string {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`
}
