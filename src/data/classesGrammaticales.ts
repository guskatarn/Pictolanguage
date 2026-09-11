import { ClasseGrammaticale, PictogramItem, ProfileSettings } from '../types'
import { getCategoryStyle } from './defaultCategories'

/**
 * Codage couleur grammatical, dit clé de Fitzgerald — la convention la plus
 * répandue en CAA francophone.
 *
 * Regroupement standard : jaune pour les pronoms, vert pour les verbes, bleu
 * pour les mots qui décrivent, orange pour les noms, rose pour le social,
 * violet pour les questions, rouge pour la négation, gris pour les petits mots
 * grammaticaux. `adverbe` reçoit un bleu distinct de celui des adjectifs :
 * la convention les réunit sous « descripteurs », mais deux teintes proches
 * gardent la parenté visible tout en laissant le mot repérable.
 *
 * **Palette et regroupement à valider par une orthophoniste avant d'être
 * figés.** Tout est ici, une ligne par classe : la revue tient sur un écran.
 *
 * Trois tons par classe, jamais deux. Le libellé est écrit dans le ton foncé,
 * jamais dans celui de la bordure : le projet a déjà connu des libellés entre
 * 1,8 et 4,4:1 de contraste pour avoir confondu couleur de bordure et couleur
 * de texte. `classesGrammaticales.test.ts` mesure désormais chaque paire.
 */
export interface Palette {
  fond: string
  bordure: string
  texte: string
}

export const PALETTE_FITZGERALD: Record<ClasseGrammaticale, Palette> = {
  // Le jaune est le seul ton de la clé qui ne supporte pas d'être pâle : à
  // #FEF9C3 sa bordure tombait à 2,7:1 et son fond se confondait presque avec
  // celui de l'application. Il est donc pris un cran plus soutenu que les
  // autres — l'écart est voulu, ne pas l'« harmoniser ».
  pronom: { fond: '#FEF08A', bordure: '#A16207', texte: '#713F12' },
  verbe: { fond: '#DCFCE7', bordure: '#16A34A', texte: '#14532D' },
  adjectif: { fond: '#DBEAFE', bordure: '#2563EB', texte: '#1E3A8A' },
  adverbe: { fond: '#CFFAFE', bordure: '#0891B2', texte: '#164E63' },
  nom: { fond: '#FFEDD5', bordure: '#EA580C', texte: '#7C2D12' },
  petitMot: { fond: '#F3F4F6', bordure: '#6B7280', texte: '#1F2937' },
  question: { fond: '#EDE9FE', bordure: '#7C3AED', texte: '#4C1D95' },
  social: { fond: '#FCE7F3', bordure: '#DB2777', texte: '#831843' },
  negation: { fond: '#FEE2E2', bordure: '#DC2626', texte: '#7F1D1D' },
}

/** Employée quand aucune classe n'est connue : un mot ajouté par un parent. */
export const PALETTE_NEUTRE: Palette = {
  fond: '#F3F4F6',
  bordure: '#6B7280',
  texte: '#1F2937',
}

/**
 * Cases qui ouvrent une page. Ce ne sont pas des mots : leur donner la couleur
 * de leur thème en mode grammatical brouillerait la clé — la page Actions,
 * orange, se lirait comme un nom. Ardoise, un cran plus soutenu que le neutre
 * des mots ajoutés par un parent, pour que les deux ne se confondent pas.
 */
export const PALETTE_NAVIGATION: Palette = {
  fond: '#E2E8F0',
  bordure: '#475569',
  texte: '#1E293B',
}

export const LIBELLES_CLASSES: Record<ClasseGrammaticale, string> = {
  pronom: 'Pronoms',
  verbe: 'Verbes',
  adjectif: 'Adjectifs',
  adverbe: 'Adverbes',
  nom: 'Noms',
  petitMot: 'Petits mots',
  question: 'Questions',
  social: 'Mots sociaux',
  negation: 'Négation',
}

/**
 * Couleurs d'une case, selon le mode d'affichage choisi par le parent.
 *
 * Les deux modes lisent une propriété **du pictogramme**, jamais de la page
 * affichée : c'est ce qui fait qu'un mot garde la même couleur partout, y
 * compris dans les favoris, où le codage sert justement le plus.
 */
export function getStyleCase(
  picto: Pick<PictogramItem, 'classeGrammaticale' | 'categoryId'>,
  mode: ProfileSettings['modeCouleur'],
): { bgColor: string; borderColor: string; textColor: string } {
  if (mode === 'thematique') return getCategoryStyle(picto.categoryId)

  const palette = picto.classeGrammaticale
    ? PALETTE_FITZGERALD[picto.classeGrammaticale]
    : PALETTE_NEUTRE
  return { bgColor: palette.fond, borderColor: palette.bordure, textColor: palette.texte }
}

/**
 * Couleurs d'une case de navigation : celles de la page visée en mode
 * thématique, où elles répondent à l'onglet du même thème ; l'ardoise en mode
 * grammatical, où une couleur ne doit jamais dire autre chose qu'une classe.
 */
export function getStyleNavigation(
  pageCible: string,
  mode: ProfileSettings['modeCouleur'],
): { bgColor: string; borderColor: string; textColor: string } {
  if (mode === 'thematique') return getCategoryStyle(pageCible)
  return {
    bgColor: PALETTE_NAVIGATION.fond,
    borderColor: PALETTE_NAVIGATION.bordure,
    textColor: PALETTE_NAVIGATION.texte,
  }
}
