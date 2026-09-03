import { useState, useCallback } from 'react'
import { UserProfile, ProfileSettings, CustomPictogram, HistoryEntry } from '../types'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'

const STORAGE_KEY = 'pictoapp-data'
const MAX_HISTORY = 20
const MAX_PROFILES = 6

interface StoredData {
  profiles: UserProfile[]
  activeProfileId: string | null
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredData
      // Migration : les profils créés avant l'ajout de showCoreBar n'ont pas
      // ce champ dans leurs settings stockés — on le complète à true.
      return {
        ...parsed,
        profiles: parsed.profiles.map((p) => ({
          ...p,
          settings: { ...p.settings, showCoreBar: p.settings?.showCoreBar ?? true },
        })),
      }
    }
  } catch {
    // localStorage indisponible (navigation privée, quota...) : on repart à vide.
  }
  return { profiles: [], activeProfileId: null }
}

function saveData(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Échec silencieux (quota dépassé, navigation privée...) : rien à faire de plus ici.
  }
}

function createDefaultProfile(name: string, avatar: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    name,
    avatar,
    favorites: [],
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

  const persist = useCallback((next: StoredData) => {
    setData(next)
    saveData(next)
  }, [])

  const activeProfile = data.profiles.find((p) => p.id === data.activeProfileId) ?? null

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
      persist(next)
      return profile
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

  const addCustomPictogram = useCallback(
    (profileId: string, picto: Omit<CustomPictogram, 'id'>) => {
      const custom: CustomPictogram = { ...picto, id: crypto.randomUUID() }
      const next: StoredData = {
        ...data,
        profiles: data.profiles.map((p) => {
          if (p.id !== profileId) return p
          return { ...p, customPictograms: [...p.customPictograms, custom] }
        }),
      }
      persist(next)
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

  return {
    profiles: data.profiles,
    activeProfile,
    setActiveProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    addToHistory,
    toggleHidePictogram,
    toggleFavorite,
    addCustomPictogram,
    removeCustomPictogram,
    updateSettings,
    reorderCategories,
  }
}
