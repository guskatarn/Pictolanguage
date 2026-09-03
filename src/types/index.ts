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
  favorites: number[]
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
}

export interface Category {
  id: string
  name: string
  color: string
  bgColor: string
  tabColor: string
  pictogramIds: number[]
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
