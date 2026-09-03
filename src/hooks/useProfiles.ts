import { useState, useCallback, useMemo } from 'react'
import {
  UserProfile,
  ProfileSettings,
  CustomPictogram,
  HistoryEntry,
  StoredData,
} from '../types'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'
import { loadData, saveData, parseBackup, downloadBackup } from '../utils/storage'

const MAX_HISTORY = 20
export const MAX_PROFILES = 6

export type ImportMode = 'replace' | 'merge'
export interface ImportOutcome {
  ok: boolean
  message: string
}

const QUOTA_MESSAGE =
  "L'espace de stockage de l'appareil est plein : la dernière modification n'a pas été enregistrée. " +
  'Exportez vos données (onglet « Sauvegarde »), puis supprimez quelques pictogrammes personnalisés ou un profil inutilisé.'

const UNAVAILABLE_MESSAGE =
  "Le stockage de cet appareil est inaccessible (navigation privée ?). L'application reste utilisable, " +
  'mais les modifications seront perdues à la fermeture.'

function createDefaultProfile(name: string, avatar: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    name,
    avatar,
    favorites: [],
    favoritesCustom: [],
    hidden: [],
    hiddenCustom: [],
    categoryOrder: DEFAULT_CATEGORIES.map((c) => c.id),
    customPictograms: [],
    history: [],
    settings: {
      pictogramSize: 'M',
      voiceRate: 1,
      voiceVolume: 1,
      showCoreBar: true,
    },
  }
}

export function useProfiles() {
  const [data, setData] = useState<StoredData>(() => loadData())
  const [storageError, setStorageError] = useState<string | null>(null)

  /**
   * Enregistre **avant** de mettre à jour l'état affiché.
   *
   * L'ordre importe : en écrivant après coup et en avalant l'exception, une
   * saturation du quota laissait l'interface afficher des données qui n'étaient
   * plus persistées nulle part — tout disparaissait au rechargement suivant,
   * sans le moindre message. Ici, un échec de quota annule la modification à
   * l'écran, si bien que ce qui est affiché correspond toujours à ce qui est
   * réellement enregistré.
   */
  const persist = useCallback((next: StoredData): boolean => {
    const result = saveData(next)
    if (result.ok) {
      setData(next)
      return true
    }
    if (result.reason === 'unavailable') {
      // Stockage totalement inaccessible : refuser les modifications rendrait
      // l'application inutilisable. On dégrade en session mémoire, en prévenant.
      setData(next)
      setStorageError(UNAVAILABLE_MESSAGE)
      return true
    }
    setStorageError(QUOTA_MESSAGE)
    return false
  }, [])

  const dismissStorageError = useCallback(() => setStorageError(null), [])

  const activeProfile = data.profiles.find((p) => p.id === data.activeProfileId) ?? null

  /** Taille approximative des données persistées, pour la jauge d'occupation. */
  const usedBytes = useMemo(() => JSON.stringify(data).length, [data])

  const setActiveProfileId = useCallback(
    (id: string | null) => {
      persist({ ...data, activeProfileId: id })
    },
    [data, persist],
  )

  const createProfile = useCallback(
    (name: string, avatar: string): UserProfile | null => {
      if (data.profiles.length >= MAX_PROFILES) return null
      const profile = createDefaultProfile(name, avatar)
      // Activate the new profile in the same update to avoid stale-closure race
      const next: StoredData = {
        profiles: [...data.profiles, profile],
        activeProfileId: profile.id,
      }
      return persist(next) ? profile : null
    },
    [data, persist],
  )

  const updateProfile = useCallback(
    (id: string, updates: Partial<UserProfile>) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }
      persist(next)
    },
    [data, persist],
  )

  const deleteProfile = useCallback(
    (id: string) => {
      const next: StoredData = {
        profiles: data.profiles.filter((p) => p.id !== id),
        activeProfileId: data.activeProfileId === id ? null : data.activeProfileId,
      }
      persist(next)
    },
    [data, persist],
  )

  const addToHistory = useCallback(
    (profileId: string, words: string[]) => {
      if (!words.length) return
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        words,
        timestamp: Date.now(),
      }
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          const history = [entry, ...p.history].slice(0, MAX_HISTORY)
          return { ...p, history }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const toggleHidePictogram = useCallback(
    (profileId: string, pictoId: number) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          const hidden = p.hidden.includes(pictoId)
            ? p.hidden.filter((id) => id !== pictoId)
            : [...p.hidden, pictoId]
          return { ...p, hidden }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const toggleHideCustomPictogram = useCallback(
    (profileId: string, customId: string) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          const hiddenCustom = p.hiddenCustom.includes(customId)
            ? p.hiddenCustom.filter((id) => id !== customId)
            : [...p.hiddenCustom, customId]
          return { ...p, hiddenCustom }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const toggleFavorite = useCallback(
    (profileId: string, pictoId: number) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          const favorites = p.favorites.includes(pictoId)
            ? p.favorites.filter((id) => id !== pictoId)
            : [...p.favorites, pictoId]
          return { ...p, favorites }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const toggleFavoriteCustom = useCallback(
    (profileId: string, customId: string) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          const favoritesCustom = p.favoritesCustom.includes(customId)
            ? p.favoritesCustom.filter((id) => id !== customId)
            : [...p.favoritesCustom, customId]
          return { ...p, favoritesCustom }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  /** Renvoie `false` si l'ajout n'a pas pu être enregistré (quota saturé). */
  const addCustomPictogram = useCallback(
    (profileId: string, picto: Omit<CustomPictogram, 'id'>): boolean => {
      const custom: CustomPictogram = { ...picto, id: crypto.randomUUID() }
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          return { ...p, customPictograms: [...p.customPictograms, custom] }
        }),
      }
      return persist(next)
    },
    [data, persist],
  )

  const removeCustomPictogram = useCallback(
    (profileId: string, customId: string) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          return {
            ...p,
            customPictograms: p.customPictograms.filter((c) => c.id !== customId),
            hiddenCustom: p.hiddenCustom.filter((id) => id !== customId),
            favoritesCustom: p.favoritesCustom.filter((id) => id !== customId),
          }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const updateSettings = useCallback(
    (profileId: string, settings: Partial<ProfileSettings>) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          return { ...p, settings: { ...p.settings, ...settings } }
        }),
      }
      persist(next)
    },
    [data, persist],
  )

  const reorderCategories = useCallback(
    (profileId: string, categoryOrder: string[]) => {
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) =>
          p.id === profileId ? { ...p, categoryOrder } : p,
        ),
      }
      persist(next)
    },
    [data, persist],
  )

  const exportData = useCallback(() => downloadBackup(data), [data])

  /**
   * Restaure un fichier de sauvegarde. `replace` écrase tout ; `merge` n'ajoute
   * que les profils absents (cas « une tablette à la maison, une à l'école »)
   * et n'écrase jamais un profil existant.
   */
  const importData = useCallback(
    (raw: string, mode: ImportMode): ImportOutcome => {
      let incoming: StoredData
      try {
        incoming = parseBackup(raw)
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Import impossible.',
        }
      }

      if (mode === 'replace') {
        if (!persist(incoming)) return { ok: false, message: QUOTA_MESSAGE }
        const count = incoming.profiles.length
        return {
          ok: true,
          message: `${count} profil${count > 1 ? 's' : ''} restauré${count > 1 ? 's' : ''}. Les données précédentes ont été remplacées.`,
        }
      }

      const existingIds = new Set(data.profiles.map((p) => p.id))
      const candidates = incoming.profiles.filter((p) => !existingIds.has(p.id))
      if (!candidates.length) {
        return { ok: false, message: 'Ces profils sont déjà présents sur cet appareil.' }
      }

      const room = MAX_PROFILES - data.profiles.length
      if (room <= 0) {
        return {
          ok: false,
          message: `Nombre maximum de profils atteint (${MAX_PROFILES}). Supprimez-en un avant d'importer.`,
        }
      }

      const added = candidates.slice(0, room)
      const next: StoredData = { ...data, profiles: [...data.profiles, ...added] }
      if (!persist(next)) return { ok: false, message: QUOTA_MESSAGE }

      const ignored = candidates.length - added.length
      return {
        ok: true,
        message:
          `${added.length} profil${added.length > 1 ? 's' : ''} ajouté${added.length > 1 ? 's' : ''}.` +
          (ignored ? ` ${ignored} ignoré${ignored > 1 ? 's' : ''} faute de place.` : ''),
      }
    },
    [data, persist],
  )

  return {
    profiles: data.profiles,
    activeProfile,
    usedBytes,
    storageError,
    dismissStorageError,
    setActiveProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    addToHistory,
    toggleHidePictogram,
    toggleHideCustomPictogram,
    toggleFavorite,
    toggleFavoriteCustom,
    addCustomPictogram,
    removeCustomPictogram,
    updateSettings,
    reorderCategories,
    exportData,
    importData,
  }
}
