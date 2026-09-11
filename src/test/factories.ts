import { EntreeLexique, RefSlot, UserProfile } from '../types'
import { ORDRE_PAGES_PAR_DEFAUT, TABLEAU_TLA } from '../data/tableauTla'
import { nombreDeSlots } from '../utils/pages'

/**
 * Fabrique de profil pour les tests.
 *
 * Centralisée à dessein : chaque champ ajouté à `UserProfile` cassait jusqu'ici
 * autant de fixtures qu'il y avait de fichiers de test.
 */
export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    name: 'Lina',
    avatar: '🦊',
    tableauId: 'tla-fr',
    pageFavoris: new Array(nombreDeSlots(TABLEAU_TLA.geometrie)).fill(null),
    slotsMasques: [],
    ordrePages: [...ORDRE_PAGES_PAR_DEFAUT],
    lexiquePerso: [],
    placements: {},
    history: [],
    settings: {
      tailleCase: 'M',
      voiceRate: 1,
      voiceVolume: 1,
      modeCouleur: 'grammatical',
      formulation: 'naturelle',
      accord: 'masculin',
    },
    ...overrides,
  }
}

export function makeMotPerso(overrides: Partial<EntreeLexique> = {}): EntreeLexique {
  return {
    id: 'c1',
    mot: 'Maman',
    imageUrl: 'data:image/webp;base64,UklGRg==',
    classeGrammaticale: 'nom',
    ...overrides,
  }
}

/**
 * Page de favoris de la bonne longueur, remplie depuis le début.
 *
 * Passer par cette fabrique plutôt que par un tableau littéral : la page de
 * favoris est creuse et de longueur fixe, et un tableau court ferait passer
 * des tests que la normalisation rejetterait en vrai.
 */
export function makePageFavoris(...refs: RefSlot[]): (RefSlot | null)[] {
  const page: (RefSlot | null)[] = new Array(nombreDeSlots(TABLEAU_TLA.geometrie)).fill(null)
  refs.forEach((ref, i) => {
    page[i] = ref
  })
  return page
}
