import { BackupFile, EntreeLexique, ProfileSettings, StoredData, UserProfile } from '../types'
import { ORDRE_PAGES_PAR_DEFAUT, TABLEAU_TLA } from '../data/tableauTla'
import { lireRefSlot, nombreDeSlots } from './pages'

// Ces clés portent l'ancien nom de l'application, à dessein : les renommer
// rendrait invisibles les profils déjà enregistrés sur les appareils, qui
// resteraient stockés sous l'ancienne clé. Un identifiant technique n'a pas à
// suivre le nom commercial ; ne pas « corriger » cette incohérence apparente
// sans écrire au préalable une migration des données existantes.
const STORAGE_KEY = 'pictoapp-data'
const PROBE_KEY = 'pictoapp-storage-probe'
const BACKUP_VERSION = 2

/**
 * Version du format persisté. À incrémenter à chaque changement de forme des
 * données, en ajoutant la fonction correspondante à `MIGRATIONS`.
 */
export const SCHEMA_VERSION = 2

/**
 * Migrations d'un format vers le suivant, indexées par version de départ.
 *
 * Vide aujourd'hui : le modèle de pages est le premier format versionné, et
 * aucune installation ne porte le format antérieur. Une donnée sans
 * `schemaVersion` est donc écartée au chargement plutôt que devinée. La
 * mécanique reste en place pour que la prochaine évolution du format soit un
 * ajout d'une ligne, et non une reprise de `loadData`.
 */
const MIGRATIONS: Record<number, (donnees: unknown) => unknown> = {}

/**
 * Amène des données lues à la version courante. `null` si elles viennent d'un
 * format qu'on ne sait pas reprendre — mieux vaut repartir à vide que faire
 * tourner l'application sur une forme qu'elle interprète de travers.
 */
function migrer(brut: unknown): unknown | null {
  let version = (brut as { schemaVersion?: unknown })?.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null
  if (version > SCHEMA_VERSION) return null

  let donnees = brut
  while (version < SCHEMA_VERSION) {
    const etape = MIGRATIONS[version]
    if (!etape) return null
    donnees = etape(donnees)
    version += 1
  }
  return donnees
}

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

const IDS_PAGES = new Set(TABLEAU_TLA.pages.map((p) => p.id))
const TAILLE_PAGE_FAVORIS = nombreDeSlots(TABLEAU_TLA.geometrie)

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014)
  )
}

export const DONNEES_VIDES: StoredData = {
  schemaVersion: SCHEMA_VERSION,
  profiles: [],
  activeProfileId: null,
  parentPin: null,
}

function normalizeSettings(raw?: Partial<ProfileSettings>): ProfileSettings {
  return {
    tailleCase: raw?.tailleCase ?? 'M',
    voiceRate: typeof raw?.voiceRate === 'number' ? raw.voiceRate : 1,
    voiceVolume: typeof raw?.voiceVolume === 'number' ? raw.voiceVolume : 1,
    // Un profil créé aujourd'hui démarre en codage grammatical, le mode que le
    // tableau de langage assisté suppose.
    modeCouleur: raw?.modeCouleur === 'thematique' ? 'thematique' : 'grammatical',
    formulation: raw?.formulation === 'brute' ? 'brute' : 'naturelle',
    accord: raw?.accord === 'feminin' ? 'feminin' : 'masculin',
    showCoreBar: raw?.showCoreBar ?? true,
  }
}

/** Une case n'est retenue que si sa page existe encore dans le tableau livré. */
function refSlotConnue(ref: unknown): ref is string {
  if (typeof ref !== 'string') return false
  const lu = lireRefSlot(ref)
  return lu !== null && IDS_PAGES.has(lu.pageId)
}

function normalizeMotPerso(raw: unknown): EntreeLexique | null {
  const c = raw as Partial<EntreeLexique>
  if (typeof c?.id !== 'string' || typeof c?.mot !== 'string') return null
  if (typeof c.imageUrl !== 'string' || !c.imageUrl) return null
  return {
    id: c.id,
    mot: c.mot,
    imageUrl: c.imageUrl,
    // Un mot ajouté par un parent n'est pas étiqueté : il traverse la
    // formulation tel quel, et se colore en neutre. Le parent pourra lui
    // donner une classe plus tard sans changement de format.
    classeGrammaticale: c.classeGrammaticale ?? 'nom',
    ...(c.morpho ? { morpho: c.morpho } : {}),
  }
}

/**
 * Ordre des pages : on garde celui du profil, débarrassé des pages disparues,
 * puis on ajoute à la fin celles qu'une mise à jour aurait introduites.
 *
 * Les placer à la fin et non au début n'est pas un détail : une page nouvelle
 * surgissant en tête décalerait d'un cran tous les repères que l'enfant s'est
 * construits.
 */
function normalizeOrdrePages(raw: unknown): string[] {
  const demande = Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : []
  const retenu = demande.filter((id, i) => IDS_PAGES.has(id) && demande.indexOf(id) === i)
  const manquantes = ORDRE_PAGES_PAR_DEFAUT.filter((id) => !retenu.includes(id))
  return [...retenu, ...manquantes]
}

/**
 * Complète un profil éventuellement incomplet (lu depuis un fichier de
 * sauvegarde, ou écrit par une version antérieure) avec les valeurs par défaut.
 */
function normalizeProfile(raw: Partial<UserProfile>): UserProfile | null {
  if (typeof raw?.id !== 'string' || typeof raw?.name !== 'string') return null

  const lexiquePerso = Array.isArray(raw.lexiquePerso)
    ? raw.lexiquePerso.map(normalizeMotPerso).filter((e): e is EntreeLexique => e !== null)
    : []
  const idsPerso = new Set(lexiquePerso.map((e) => e.id))

  // Un placement qui désigne un mot supprimé, ou une page disparue, laisse
  // simplement sa case vide : c'est une référence périmée, pas une erreur.
  const placements: Record<string, string> = {}
  for (const [ref, lexiqueId] of Object.entries(raw.placements ?? {})) {
    if (refSlotConnue(ref) && typeof lexiqueId === 'string' && idsPerso.has(lexiqueId)) {
      placements[ref] = lexiqueId
    }
  }

  const favorisBruts = Array.isArray(raw.pageFavoris) ? raw.pageFavoris : []
  const pageFavoris: (string | null)[] = Array.from({ length: TAILLE_PAGE_FAVORIS }, (_, i) =>
    refSlotConnue(favorisBruts[i]) ? (favorisBruts[i] as string) : null,
  )

  return {
    id: raw.id,
    name: raw.name,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '🙂',
    tableauId: typeof raw.tableauId === 'string' ? raw.tableauId : TABLEAU_TLA.id,
    pageFavoris,
    slotsMasques: Array.isArray(raw.slotsMasques) ? raw.slotsMasques.filter(refSlotConnue) : [],
    ordrePages: normalizeOrdrePages(raw.ordrePages),
    lexiquePerso,
    placements,
    history: Array.isArray(raw.history) ? raw.history : [],
    settings: normalizeSettings(raw.settings),
  }
}

function normalizeStoredData(raw: unknown): StoredData | null {
  const migre = migrer(raw)
  if (typeof migre !== 'object' || migre === null) return null
  const candidate = migre as Partial<StoredData>
  if (!Array.isArray(candidate.profiles)) return null
  const profiles = candidate.profiles
    .map((p) => normalizeProfile(p as Partial<UserProfile>))
    .filter((p): p is UserProfile => p !== null)
  const activeProfileId =
    typeof candidate.activeProfileId === 'string' &&
    profiles.some((p) => p.id === candidate.activeProfileId)
      ? candidate.activeProfileId
      : null
  // Un code corrompu (mauvaise longueur, caractères non numériques, données
  // d'une version antérieure) est traité comme une absence de code : mieux vaut
  // une application déverrouillée qu'un parent enfermé hors de ses données par
  // un code que personne ne peut plus saisir.
  const parentPin =
    typeof candidate.parentPin === 'string' && /^\d{4}$/.test(candidate.parentPin)
      ? candidate.parentPin
      : null
  return { schemaVersion: SCHEMA_VERSION, profiles, activeProfileId, parentPin }
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeStoredData(JSON.parse(raw)) ?? DONNEES_VIDES
  } catch {
    // Stockage indisponible ou contenu corrompu : on repart à vide plutôt que
    // de bloquer le démarrage de l'application.
  }
  return DONNEES_VIDES
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
    throw new Error("Fichier illisible : ce n'est pas une sauvegarde disavecmoi.")
  }

  // Le marqueur garde l'ancien nom, contrairement aux messages ci-dessus : le
  // changer rendrait irrécupérables les sauvegardes déjà exportées, à moins
  // d'accepter les deux valeurs à l'import.
  const candidate = parsed as Partial<BackupFile>
  if (candidate?.app !== 'pictolanguage') {
    throw new Error("Ce fichier ne vient pas de disavecmoi.")
  }
  if (typeof candidate.version !== 'number' || candidate.version > BACKUP_VERSION) {
    throw new Error(
      'Cette sauvegarde a été créée par une version plus récente de l\'application.',
    )
  }

  const data = normalizeStoredData(candidate.data)
  if (!data) {
    throw new Error(
      candidate.version < BACKUP_VERSION
        ? "Cette sauvegarde vient d'une version antérieure au tableau de langage assisté et ne peut plus être relue."
        : 'Sauvegarde incomplète : aucun profil exploitable.',
    )
  }
  if (!data.profiles.length) throw new Error('Cette sauvegarde ne contient aucun profil.')
  return data
}

export function backupFilename(): string {
  return `disavecmoi-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
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
