import { ProfileSettings } from '../types'

/**
 * La question porte sur ce que l'enfant **dira**, pas sur ce qu'il est : le
 * choix se fait sur la phrase entendue, sans avoir à nommer un genre.
 * Partagé entre la création de profil et les réglages.
 */
export const CHOIX_ACCORD: { id: ProfileSettings['accord']; phrase: string }[] = [
  { id: 'masculin', phrase: '« je suis content »' },
  { id: 'feminin', phrase: '« je suis contente »' },
]

/** Un exemple entendu vaut mieux qu'une description de la règle. */
export const CHOIX_FORMULATION: {
  id: ProfileSettings['formulation']
  libelle: string
  exemple: string
}[] = [
  { id: 'naturelle', libelle: 'Phrase construite', exemple: '« je veux manger »' },
  { id: 'brute', libelle: 'Mot à mot', exemple: '« moi, vouloir, manger »' },
]
