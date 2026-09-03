import { BackupFile, StoredData, UserProfile } from '../types'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'

const STORAGE_KEY = 'pictoapp-data'
const PROBE_KEY = 'pictoapp-storage-probe'
const BACKUP_VERSION = 1

/** Budget indicatif retenu pour la jauge : la plupart des navigateurs plafonnent ici. */
export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' }

/**
 * L'écriture est-elle réellement possible ? En navigation privée (Safari en
 * particulier) ou avec le stockage désactivé, `setItem` lève dès le premier
 * octet la même erreur qu'un stockage plein. Sans cette distinction, on
 * refuserait toute modification à l'utilisateur au lieu de dégrader proprement
 * en session mémoire.
 */
function probeWritable(): boolean {
  try {
    localStorage.setItem(PROBE_KEY, '1')
    localStorage.removeItem(PROBE_KEY)
    return true
  } catch {
    return false
  }
}

const storageWritable = probeWritable()

export function isStorageWritable(): boolean {
  return storageWritable
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014)
  )
}

/**
 * Complète un profil éventuellement incomplet (créé par une version antérieure,
 * ou lu depuis un fichier de sauvegarde) avec les valeurs par défaut.
 */
function normalizeProfile(raw: Partial<UserProfile>): UserProfile | null {
  if (typeof raw?.id !== 'string' || typeof raw?.name !== 'string') return null
  return {
    id: raw.id,
    name: raw.name,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '🙂',
    favorites: Array.isArray(raw.favorites) ? raw.favorites : [],
    hidden: Array.isArray(raw.hidden) ? raw.hidden : [],
    hiddenCustom: Array.isArray(raw.hiddenCustom) ? raw.hiddenCustom : [],
    categoryOrder: Array.isArray(raw.categoryOrder) && raw.categoryOrder.length
      ? raw.categoryOrder
      : DEFAULT_CATEGORIES.map((c) => c.id),
    customPictograms: Array.isArray(raw.customPictograms) ? raw.customPictograms : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    settings: {
      pictogramSize: raw.settings?.pictogramSize ?? 'M',
      voiceRate: typeof raw.settings?.voiceRate === 'number' ? raw.settings.voiceRate : 1,
      voiceVolume: typeof raw.settings?.voiceVolume === 'number' ? raw.settings.voiceVolume : 1,
      showCoreBar: raw.settings?.showCoreBar ?? true,
    },
  }
}

function normalizeStoredData(raw: unknown): StoredData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const candidate = raw as Partial<StoredData>
  if (!Array.isArray(candidate.profiles)) return null
  const profiles = candidate.profiles
    .map((p) => normalizeProfile(p as Partial<UserProfile>))
    .filter((p): p is UserProfile => p !== null)
  const activeProfileId =
    typeof candidate.activeProfileId === 'string' &&
    profiles.some((p) => p.id === candidate.activeProfileId)
      ? candidate.activeProfileId
      : null
  return { profiles, activeProfileId }
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeStoredData(JSON.parse(raw)) ?? { profiles: [], activeProfileId: null }
  } catch {
    // Stockage indisponible ou contenu corrompu : on repart à vide plutôt que
    // de bloquer le démarrage de l'application.
  }
  return { profiles: [], activeProfileId: null }
}

export function saveData(data: StoredData): SaveResult {
  if (!storageWritable) return { ok: false, reason: 'unavailable' }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: isQuotaError(err) ? 'quota' : 'unavailable' }
  }
}

export function buildBackup(data: StoredData): BackupFile {
  return {
    app: 'pictolanguage',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Valide et normalise un fichier de sauvegarde. Lève une erreur au message
 * lisible par un parent, plutôt que de laisser passer des données douteuses
 * dans le stockage.
 */
export function parseBackup(raw: string): StoredData {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Fichier illisible : ce n'est pas une sauvegarde PictoLanguage.")
  }

  const candidate = parsed as Partial<BackupFile>
  if (candidate?.app !== 'pictolanguage') {
    throw new Error("Ce fichier ne vient pas de PictoLanguage.")
  }
  if (typeof candidate.version !== 'number' || candidate.version > BACKUP_VERSION) {
    throw new Error(
      'Cette sauvegarde a été créée par une version plus récente de l\'application.',
    )
  }

  const data = normalizeStoredData(candidate.data)
  if (!data) throw new Error('Sauvegarde incomplète : aucun profil exploitable.')
  if (!data.profiles.length) throw new Error('Cette sauvegarde ne contient aucun profil.')
  return data
}

export function backupFilename(): string {
  return `pictolanguage-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
}

/** Déclenche le téléchargement du fichier de sauvegarde. */
export function downloadBackup(data: StoredData): void {
  const blob = new Blob([JSON.stringify(buildBackup(data), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename()
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
