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
  /**
   * Catégorie de rangement du pictogramme, d'où viennent ses couleurs.
   * Absente pour un résultat de recherche ARASAAC, qui n'est encore rangé
   * nulle part. Voir `getCategoryStyle`.
   */
  categoryId?: string
  /**
   * Masqué par le parent. Le pictogramme est tout de même renvoyé : la grille
   * laisse sa case vide au lieu de refermer le trou, sans quoi masquer un mot
   * décalerait tous les suivants et détruirait les repères moteurs de l'enfant.
   */
  isHidden?: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  bgColor: string
  tabColor: string
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
  /**
   * Code parent à quatre chiffres, `null` tant qu'aucun n'a été choisi.
   *
   * Volontairement **hors des profils** : il protège l'appareil, pas un enfant
   * en particulier. Le ranger dans un profil permettrait d'en changer pour
   * contourner le verrou. Enregistré en clair — voir `ParentGate` pour la
   * raison.
   */
  parentPin: string | null
}

/** Enveloppe d'un fichier de sauvegarde exporté par l'utilisateur. */
export interface BackupFile {
  app: 'pictolanguage'
  version: number
  exportedAt: string
  data: StoredData
}
