import { PictogramEntry } from '../types'

/**
 * Vocabulaire "core" : les mots fonctionnels les plus fréquents en CAA
 * (communication alternative et améliorée), toujours accessibles quelle
 * que soit la catégorie affichée, pour permettre de construire des phrases
 * spontanées sans naviguer entre onglets. Principe standard des outils de
 * CAA professionnels (LAMP, PODD, Proloquo2Go...).
 *
 * Sélection volontairement courte (10 mots) pour rester scannable en un
 * coup d'œil. Les ids sont des pictogrammes ARASAAC réels.
 */
export const CORE_VOCABULARY: PictogramEntry[] = [
  { id: 6632, word: 'moi', categoryId: 'core' },
  { id: 5441, word: 'vouloir', categoryId: 'core' },
  { id: 19524, word: 'aide', categoryId: 'core' },
  { id: 37163, word: 'encore', categoryId: 'core' },
  { id: 38251, word: 'stop', categoryId: 'core' },
  { id: 5584, word: 'oui', categoryId: 'core' },
  { id: 5526, word: 'non', categoryId: 'core' },
  { id: 11538, word: 'aimer', categoryId: 'core' },
  { id: 28431, word: 'donner', categoryId: 'core' },
  { id: 8081, word: 'fini', categoryId: 'core' },
]
