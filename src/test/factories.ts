import { CustomPictogram, UserProfile } from '../types'

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
    favorites: [],
    favoritesCustom: [],
    hidden: [],
    hiddenCustom: [],
    categoryOrder: ['besoins', 'emotions'],
    customPictograms: [],
    history: [],
    settings: { pictogramSize: 'M', voiceRate: 1, voiceVolume: 1, showCoreBar: true },
    ...overrides,
  }
}

export function makeCustomPictogram(overrides: Partial<CustomPictogram> = {}): CustomPictogram {
  return {
    id: 'c1',
    word: 'Maman',
    imageUrl: 'data:image/webp;base64,UklGRg==',
    categoryId: 'besoins',
    ...overrides,
  }
}
