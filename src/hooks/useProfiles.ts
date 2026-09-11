import { useState, useCallback, useMemo } from 'react'
import {
  UserProfile,
  ProfileSettings,
  EntreeLexique,
  HistoryEntry,
  RefSlot,
  StoredData,
} from '../types'
import { ORDRE_PAGES_PAR_DEFAUT, TABLEAU_TLA, trouverPage } from '../data/tableauTla'
import { nombreDeSlots, premierSlotLibre } from '../utils/pages'
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

/**
 * `accord` n'est pas encore demandé à la création : il ne produit d'effet
 * qu'une fois la formulation des phrases en place. Poser la question avant
 * qu'elle ne change quoi que ce soit ne ferait qu'ajouter une étape opaque.
 */
function createDefaultProfile(name: string, avatar: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    name,
    avatar,
    tableauId: TABLEAU_TLA.id,
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

  /**
   * Installe, remplace ou retire le code parent (`null` pour le retirer).
   * Passe par `persist`, donc un quota saturé annule le changement au lieu de
   * laisser croire à un verrou qui n'aurait pas été enregistré.
   */
  const setParentPin = useCallback(
    (pin: string | null) => persist({ ...data, parentPin: pin }),
    [data, persist],
  )

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
      // Activate the new profile in the same update to avoid stale-closure race.
      // `...data` d'abord : sans lui, créer un profil effacerait tout champ
      // hors profils — le code parent, aujourd'hui, et le suivant demain.
      const next: StoredData = {
        ...data,
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
        ...data,
        profiles: data.profiles.filter((p) => p.id !== id),
        activeProfileId: data.activeProfileId === id ? null : data.activeProfileId,
      }
      persist(next)
    },
    [data, persist],
  )

  /**
   * La phrase restant affichée après lecture (elle sert souvent deux ou trois
   * fois de suite), « Parler » est appuyé plusieurs fois sur la même phrase.
   * L'enregistrer à chaque fois remplirait l'historique de doublons et en
   * chasserait les phrases précédentes, qui sont justement ce qu'on vient y
   * rechercher.
   */
  const addToHistory = useCallback(
    (profileId: string, words: string[]) => {
      if (!words.length) return
      const profile = data.profiles.find((p) => p.id === profileId)
      const last = profile?.history[0]
      if (last && last.words.length === words.length && last.words.every((w, i) => w === words[i])) {
        return
      }
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

  /** Applique une transformation au seul profil visé. */
  const majProfil = useCallback(
    (profileId: string, transforme: (p: UserProfile) => UserProfile): boolean =>
      persist({
        ...data,
        profiles: data.profiles.map((p) => (p.id === profileId ? transforme(p) : p)),
      }),
    [data, persist],
  )

  /**
   * Masque ou réaffiche **une case**, jamais un mot.
   *
   * La distinction est le cœur du modèle : un même mot occupe souvent
   * plusieurs cases du tableau, et masquer par identifiant les emportait
   * toutes d'un coup — retirer « moi » de la page Personnes le faisait aussi
   * disparaître de l'accueil, sans que rien ne l'annonce.
   */
  const basculerMasque = useCallback(
    (profileId: string, ref: RefSlot) =>
      majProfil(profileId, (p) => ({
        ...p,
        slotsMasques: p.slotsMasques.includes(ref)
          ? p.slotsMasques.filter((r) => r !== ref)
          : [...p.slotsMasques, ref],
      })),
    [majProfil],
  )

  /**
   * Ajoute ou retire un favori. Le retrait laisse un `null` à sa place plutôt
   * que de refermer la liste : la position d'un favori ne doit pas bouger
   * parce qu'un autre a été retiré. Sans place libre, rien ne se passe.
   */
  const basculerFavori = useCallback(
    (profileId: string, ref: RefSlot) =>
      majProfil(profileId, (p) => {
        const occupe = p.pageFavoris.indexOf(ref)
        if (occupe !== -1) {
          const pageFavoris = [...p.pageFavoris]
          pageFavoris[occupe] = null
          return { ...p, pageFavoris }
        }
        const libre = p.pageFavoris.indexOf(null)
        if (libre === -1) return p
        const pageFavoris = [...p.pageFavoris]
        pageFavoris[libre] = ref
        return { ...p, pageFavoris }
      }),
    [majProfil],
  )

  /**
   * Ajoute un mot personnalisé sur la première case libre de la page visée.
   *
   * Renvoie `false` si l'enregistrement a échoué (quota saturé) **ou** si la
   * page est pleine — un mot sans case serait enregistré sans jamais
   * s'afficher, exactement le défaut que le rangement en « Favoris »
   * provoquait autrefois.
   */
  const ajouterMotPerso = useCallback(
    (profileId: string, mot: string, imageUrl: string, pageId: string): boolean => {
      const page = trouverPage(pageId)
      if (!page) return false
      const profil = data.profiles.find((p) => p.id === profileId)
      if (!profil) return false

      const ref = premierSlotLibre(page, Object.keys(profil.placements))
      if (!ref) return false

      const entree: EntreeLexique = {
        id: crypto.randomUUID(),
        mot,
        imageUrl,
        classeGrammaticale: 'nom',
      }
      return majProfil(profileId, (p) => ({
        ...p,
        lexiquePerso: [...p.lexiquePerso, entree],
        placements: { ...p.placements, [ref]: entree.id },
      }))
    },
    [data, majProfil],
  )

  const retirerMotPerso = useCallback(
    (profileId: string, lexiqueId: string) =>
      majProfil(profileId, (p) => {
        const refs = Object.entries(p.placements)
          .filter(([, id]) => id === lexiqueId)
          .map(([ref]) => ref)
        const placements = { ...p.placements }
        for (const ref of refs) delete placements[ref]
        return {
          ...p,
          lexiquePerso: p.lexiquePerso.filter((e) => e.id !== lexiqueId),
          placements,
          // Les cases libérées ne doivent laisser derrière elles ni masquage ni
          // favori : ils désigneraient un mot qui n'existe plus.
          slotsMasques: p.slotsMasques.filter((r) => !refs.includes(r)),
          pageFavoris: p.pageFavoris.map((r) => (r && refs.includes(r) ? null : r)),
        }
      }),
    [majProfil],
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

  const reordonnerPages = useCallback(
    (profileId: string, ordrePages: string[]) => majProfil(profileId, (p) => ({ ...p, ordrePages })),
    [majProfil],
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
    parentPin: data.parentPin,
    setParentPin,
    basculerMasque,
    basculerFavori,
    ajouterMotPerso,
    retirerMotPerso,
    updateSettings,
    reordonnerPages,
    exportData,
    importData,
  }
}
