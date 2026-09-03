import { describe, it, expect, vi } from 'vitest'
import { loadData, saveData, parseBackup, buildBackup, downloadBackup } from './storage'
import { StoredData, UserProfile } from '../types'

const STORAGE_KEY = 'pictoapp-data'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'p1',
    name: 'Lina',
    avatar: '🦊',
    favorites: [],
    hidden: [],
    hiddenCustom: [],
    categoryOrder: ['besoins'],
    customPictograms: [],
    history: [],
    settings: { pictogramSize: 'L', voiceRate: 1.2, voiceVolume: 0.8, showCoreBar: false },
    ...overrides,
  }
}

const data: StoredData = { profiles: [makeProfile()], activeProfileId: 'p1' }

/** Force le prochain `setItem` à échouer comme un quota saturé. */
function simulateFullStorage() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError')
  })
}

describe('saveData / loadData', () => {
  it('écrit puis relit les données à l’identique', () => {
    expect(saveData(data).ok).toBe(true)
    expect(loadData()).toEqual(data)
  })

  it('signale un quota saturé au lieu d’échouer en silence', () => {
    simulateFullStorage()
    const result = saveData(data)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ reason: 'quota' })
  })

  it('laisse intactes les données déjà enregistrées quand le quota est atteint', () => {
    saveData(data)
    const before = localStorage.getItem(STORAGE_KEY)

    simulateFullStorage()
    saveData({ ...data, profiles: [makeProfile({ name: 'Écrasé ?' })] })

    // `setItem` est atomique : une écriture refusée ne détruit pas la valeur
    // précédente. C'est la divergence silencieuse qui était dangereuse, pas
    // une perte du contenu déjà persisté.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })

  it('repart d’un état vide si le contenu stocké est corrompu', () => {
    localStorage.setItem(STORAGE_KEY, '{ ceci nest pas du json')
    expect(loadData()).toEqual({ profiles: [], activeProfileId: null })
  })

  it('complète un profil créé avant l’ajout de showCoreBar', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profiles: [{ id: 'x', name: 'Ancien' }], activeProfileId: 'x' }),
    )
    const loaded = loadData()
    expect(loaded.profiles[0].settings.showCoreBar).toBe(true)
    expect(loaded.profiles[0].categoryOrder.length).toBeGreaterThan(1)
    expect(loaded.profiles[0].customPictograms).toEqual([])
  })

  it('neutralise un activeProfileId qui ne désigne aucun profil', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profiles: [{ id: 'x', name: 'Ancien' }], activeProfileId: 'disparu' }),
    )
    expect(loadData().activeProfileId).toBeNull()
  })
})

describe('parseBackup', () => {
  it('accepte une sauvegarde produite par buildBackup', () => {
    const restored = parseBackup(JSON.stringify(buildBackup(data)))
    expect(restored.profiles).toHaveLength(1)
    expect(restored.profiles[0].name).toBe('Lina')
  })

  it.each([
    ['un fichier qui n’est pas du JSON', 'bonjour'],
    ['une sauvegarde d’une autre application', JSON.stringify({ app: 'autre', version: 1, data })],
    ['une version plus récente', JSON.stringify({ app: 'pictolanguage', version: 99, data })],
    [
      'une sauvegarde sans aucun profil',
      JSON.stringify({ app: 'pictolanguage', version: 1, data: { profiles: [], activeProfileId: null } }),
    ],
    ['une sauvegarde sans champ profiles', JSON.stringify({ app: 'pictolanguage', version: 1, data: {} })],
  ])('rejette %s', (_label, raw) => {
    expect(() => parseBackup(raw)).toThrow()
  })

  it('donne un message lisible par un parent, pas une trace technique', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'autre', version: 1, data }))).toThrow(
      /ne vient pas de PictoLanguage/,
    )
  })

  it('écarte un profil corrompu sans faire échouer tout l’import', () => {
    const mixed = JSON.stringify({
      app: 'pictolanguage',
      version: 1,
      data: { profiles: [{ id: 'ok', name: 'Valide' }, { pasDeId: true }], activeProfileId: null },
    })
    const restored = parseBackup(mixed)
    expect(restored.profiles).toHaveLength(1)
    expect(restored.profiles[0].name).toBe('Valide')
  })
})

describe('downloadBackup', () => {
  it('produit un fichier JSON et libère l’URL créée', () => {
    // jsdom n'implémente pas `Blob.text()` : on intercepte le contenu au moment
    // de la construction du Blob plutôt que de tenter de le relire ensuite.
    const parts: string[] = []
    const types: (string | undefined)[] = []
    class RecordingBlob {
      constructor(chunks: string[], options?: { type?: string }) {
        parts.push(chunks.join(''))
        types.push(options?.type)
      }
    }
    vi.stubGlobal('Blob', RecordingBlob)
    const createObjectURL = vi.fn(() => 'blob:fake')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadBackup(data)

    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
    expect(types[0]).toBe('application/json')
    const written = JSON.parse(parts[0])
    expect(written.app).toBe('pictolanguage')
    expect(written.data.profiles[0].name).toBe('Lina')
    // Le lien temporaire ne doit pas rester dans le document.
    expect(document.querySelectorAll('a')).toHaveLength(0)

    vi.unstubAllGlobals()
  })
})
