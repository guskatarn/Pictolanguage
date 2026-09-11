import { describe, it, expect, vi } from 'vitest'
import {
  DONNEES_VIDES,
  buildBackup,
  downloadBackup,
  loadData,
  parseBackup,
  saveData,
} from './storage'
import { StoredData } from '../types'
import { makeProfile } from '../test/factories'
import { ORDRE_PAGES_PAR_DEFAUT, TABLEAU_TLA } from '../data/tableauTla'
import { nombreDeSlots } from './pages'

const STORAGE_KEY = 'pictoapp-data'

const data: StoredData = {
  schemaVersion: 2,
  profiles: [
    // Ordre complet : la normalisation ajoute les pages manquantes, si bien
    // qu'un ordre tronqué ne reviendrait pas identique. Cette complétion a son
    // propre test plus bas ; celui-ci ne vérifie que l'aller-retour.
    makeProfile({
      settings: {
        tailleCase: 'L',
        voiceRate: 1.2,
        voiceVolume: 0.8,
        modeCouleur: 'thematique',
        formulation: 'brute',
        accord: 'feminin',
      },
    }),
  ],
  activeProfileId: 'p1',
  parentPin: null,
}

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
    expect(loadData()).toEqual(DONNEES_VIDES)
  })

  /**
   * Le modèle de pages est le premier format versionné. Des données sans
   * `schemaVersion` viennent d'avant, ne décrivent aucune position de case, et
   * il n'existe aucune installation à reprendre : les interpréter de travers
   * serait pire que de repartir à vide.
   */
  it('écarte des données antérieures au format versionné', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profiles: [{ id: 'x', name: 'Ancien' }], activeProfileId: 'x' }),
    )
    expect(loadData()).toEqual(DONNEES_VIDES)
  })

  it('écarte des données écrites par une version future de l’application', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 99, profiles: [{ id: 'x', name: 'X' }], activeProfileId: 'x' }),
    )
    expect(loadData()).toEqual(DONNEES_VIDES)
  })

  it('complète un profil incomplet avec les valeurs par défaut', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, profiles: [{ id: 'x', name: 'Neuf' }], activeProfileId: 'x' }),
    )
    const profil = loadData().profiles[0]
    expect(profil.settings.tailleCase).toBe('M')
    expect(profil.settings.modeCouleur).toBe('grammatical')
    expect(profil.ordrePages.length).toBeGreaterThan(1)
    expect(profil.lexiquePerso).toEqual([])
    // La page de favoris est creuse mais de longueur fixe : un tableau plus
    // court ferait sortir un favori de la grille au premier ajout.
    expect(profil.pageFavoris).toHaveLength(nombreDeSlots(TABLEAU_TLA.geometrie))
    expect(profil.pageFavoris.every((r) => r === null)).toBe(true)
  })

  it('ajoute en fin d’ordre une page absente du profil', () => {
    // Une page introduite par une mise à jour ne doit pas surgir en tête :
    // elle décalerait d'un cran tous les repères de l'enfant.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        profiles: [{ id: 'x', name: 'Neuf', ordrePages: ['objets', 'besoins'] }],
        activeProfileId: 'x',
      }),
    )
    const ordre = loadData().profiles[0].ordrePages
    expect(ordre.slice(0, 2)).toEqual(['objets', 'besoins'])
    expect(ordre).toHaveLength(ORDRE_PAGES_PAR_DEFAUT.length)
  })

  it('retire l’accueil de l’ordre réordonnable s’il s’y trouve', () => {
    // L'accueil reste en tête des onglets quoi qu'il arrive : le laisser dans
    // l'ordre du parent le ferait apparaître deux fois dans les réglages.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        profiles: [{ id: 'x', name: 'Neuf', ordrePages: ['objets', 'accueil', 'besoins'] }],
        activeProfileId: 'x',
      }),
    )
    expect(loadData().profiles[0].ordrePages).not.toContain('accueil')
  })

  it('neutralise un activeProfileId qui ne désigne aucun profil', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, profiles: [{ id: 'x', name: 'Ancien' }], activeProfileId: 'disparu' }),
    )
    expect(loadData().activeProfileId).toBeNull()
  })
})

describe('références périmées dans un profil', () => {
  const mot = {
    id: 'c1',
    mot: 'chien',
    imageUrl: 'data:image/webp;base64,AAAA',
    classeGrammaticale: 'nom',
  }

  function charger(profil: Record<string, unknown>) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        profiles: [{ id: 'p1', name: 'Lina', ...profil }],
        activeProfileId: 'p1',
      }),
    )
    return loadData().profiles[0]
  }

  it('conserve un placement valide', () => {
    const profil = charger({ lexiquePerso: [mot], placements: { 'besoins#5': 'c1' } })
    expect(profil.placements).toEqual({ 'besoins#5': 'c1' })
    expect(profil.lexiquePerso[0].mot).toBe('chien')
  })

  /**
   * Une case qui désigne un mot supprimé reste simplement vide. C'est le
   * pendant du défaut historique où un pictogramme rangé dans la vue
   * « Favoris » était bien enregistré mais n'apparaissait dans aucune grille :
   * mieux vaut une case vide qu'une référence qui ne mène nulle part.
   */
  it('écarte un placement dont le mot n’existe plus', () => {
    const profil = charger({ lexiquePerso: [], placements: { 'besoins#5': 'disparu' } })
    expect(profil.placements).toEqual({})
  })

  it('écarte un placement posé sur une page inexistante', () => {
    const profil = charger({ lexiquePerso: [mot], placements: { 'page-fantome#2': 'c1' } })
    expect(profil.placements).toEqual({})
  })

  it('écarte un favori et un masquage dont l’adresse est illisible', () => {
    const profil = charger({
      pageFavoris: ['besoins#0', 'nimportequoi', 'page-fantome#1'],
      slotsMasques: ['besoins#1', 'sans-index', 'page-fantome#0'],
    })
    expect(profil.pageFavoris.slice(0, 3)).toEqual(['besoins#0', null, null])
    expect(profil.slotsMasques).toEqual(['besoins#1'])
  })

  it('écarte un mot personnalisé sans image, qui ne s’afficherait pas', () => {
    const profil = charger({ lexiquePerso: [{ id: 'c2', mot: 'sans image' }] })
    expect(profil.lexiquePerso).toEqual([])
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
      JSON.stringify({ app: 'pictolanguage', version: 2, data: { schemaVersion: 2, profiles: [], activeProfileId: null } }),
    ],
    ['une sauvegarde sans champ profiles', JSON.stringify({ app: 'pictolanguage', version: 2, data: { schemaVersion: 2 } })],
  ])('rejette %s', (_label, raw) => {
    expect(() => parseBackup(raw)).toThrow()
  })

  it('donne un message lisible par un parent, pas une trace technique', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'autre', version: 1, data }))).toThrow(
      /ne vient pas de disavecmoi/,
    )
  })

  it('écarte un profil corrompu sans faire échouer tout l’import', () => {
    const mixed = JSON.stringify({
      app: 'pictolanguage',
      version: 2,
      data: {
        schemaVersion: 2,
        profiles: [{ id: 'ok', name: 'Valide' }, { pasDeId: true }],
        activeProfileId: null,
      },
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
