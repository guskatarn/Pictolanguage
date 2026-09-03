export type PictogramSize = 'S' | 'M' | 'L'

export interface ProfileSettings {
  pictogramSize: PictogramSize
  voiceRate: number
  voiceVolume: number
  /** Barre de vocabulaire "core" toujours visible (mots fréquents, CAA). */
  showCoreBar: boolean
}

export interface HistoryEntry {
  id: string
  words: string[]
  timestamp: number
}

export interface CustomPictogram {
  id: string
  word: string
  imageUrl: string
  categoryId: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  /** Pictogrammes par défaut mis en favori (ids ARASAAC). */
  favorites: number[]
  /** Pictogrammes personnalisés mis en favori (ids internes). */
  favoritesCustom: string[]
  hidden: number[]
  hiddenCustom: string[]
  categoryOrder: string[]
  customPictograms: CustomPictogram[]
  history: HistoryEntry[]
  settings: ProfileSettings
}

export interface SentenceItem {
  key: string
  word: string
  arasaacId?: number
  customImageUrl?: string
}

export interface PictogramEntry {
  id: number
  word: string
  categoryId: string
}

export interface PictogramItem {
  key: string
  word: string
  arasaacId?: number
  imageUrl: string
  isCustom: boolean
  customId?: string
  isFavorite: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  bgColor: string
  tabColor: string
  pictogramIds: number[]
  /**
   * Vue synthétique plutôt que catégorie de rangement : elle s'affiche comme un
   * onglet mais ne peut pas contenir de pictogramme. Aucune interface ne doit la
   * proposer comme destination — un pictogramme qui y atterrit n'apparaît
   * ensuite dans aucune grille.
   */
  isView?: boolean
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Contenu intégral persisté dans `localStorage` (et exporté tel quel). */
export interface StoredData {
  profiles: UserProfile[]
  activeProfileId: string | null
}

/** Enveloppe d'un fichier de sauvegarde exporté par l'utilisateur. */
export interface BackupFile {
  app: 'pictolanguage'
  version: number
  exportedAt: string
  data: StoredData
}
