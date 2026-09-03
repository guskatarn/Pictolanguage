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
  // Panneau octogonal rouge plutôt que l'ancien 38251 (carré noir dans un
  // cercle), sémantiquement vide pour un enfant : la forme et la couleur du
  // panneau routier portent le sens à elles seules, et restent lisibles à la
  // taille réelle d'affichage (40 px) où les pictogrammes de geste deviennent
  // illisibles. Le mot « STOP » qu'il contient est redondant, non porteur.
  { id: 8289, word: 'stop', categoryId: 'core' },
  { id: 5584, word: 'oui', categoryId: 'core' },
  { id: 5526, word: 'non', categoryId: 'core' },
  { id: 11538, word: 'aimer', categoryId: 'core' },
  { id: 28431, word: 'donner', categoryId: 'core' },
  // 28429 représente le geste « fini » (mains croisées qui s'écartent), signe
  // standard en CAA. L'ancien 8081 affichait « COLORIN COLORADO », formule
  // espagnole de fin de conte : du texte, illisible pour un enfant francophone.
  { id: 28429, word: 'fini', categoryId: 'core' },
]
