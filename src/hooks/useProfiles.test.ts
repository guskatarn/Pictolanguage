import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useProfiles, MAX_PROFILES } from './useProfiles'
import { buildBackup } from '../utils/storage'
import { StoredData, UserProfile } from '../types'

/** Force toute écriture ultérieure à échouer comme un quota saturé. */
function simulateFullStorage() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError')
  })
}

function backupWith(profiles: Partial<UserProfile>[]): string {
  return JSON.stringify(
    buildBackup({ schemaVersion: 2, profiles, activeProfileId: null } as unknown as StoredData),
  )
}

describe('useProfiles — création et persistance', () => {
  it('crée un profil, l’active et l’enregistre', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    expect(result.current.profiles).toHaveLength(1)
    expect(result.current.activeProfile?.name).toBe('Lina')
    expect(JSON.parse(localStorage.getItem('pictoapp-data')!).profiles).toHaveLength(1)
  })

  it('refuse de dépasser le nombre maximum de profils', () => {
    const { result } = renderHook(() => useProfiles())
    for (let i = 0; i < MAX_PROFILES + 2; i++) {
      act(() => {
        result.current.createProfile(`Profil ${i}`, '🐻')
      })
    }
    expect(result.current.profiles).toHaveLength(MAX_PROFILES)
  })
})

describe('useProfiles — quota saturé', () => {
  it('n’applique pas la modification à l’écran si elle n’a pas pu être enregistrée', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    const profileId = result.current.activeProfile!.id
    const persisted = localStorage.getItem('pictoapp-data')

    simulateFullStorage()
    let accepted: boolean | undefined
    act(() => {
      accepted = result.current.ajouterMotPerso(
        profileId,
        'chien',
        'data:image/webp;base64,AAAA',
        'besoins',
      )
    })

    // C'est le cœur de la correction : l'ajout est refusé, l'écran n'affiche
    // donc jamais un pictogramme qui n'existe pas dans le stockage.
    expect(accepted).toBe(false)
    expect(result.current.activeProfile!.lexiquePerso).toHaveLength(0)
    expect(localStorage.getItem('pictoapp-data')).toBe(persisted)
  })

  it('remonte une erreur qui explique quoi faire, et qu’on peut refermer', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })

    simulateFullStorage()
    act(() => {
      result.current.updateSettings(result.current.activeProfile!.id, { voiceRate: 1.5 })
    })

    expect(result.current.storageError).toMatch(/plein/i)
    expect(result.current.storageError).toMatch(/Sauvegarde/)

    act(() => {
      result.current.dismissStorageError()
    })
    expect(result.current.storageError).toBeNull()
  })

  it('ne signale aucune erreur tant que les écritures passent', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    expect(result.current.storageError).toBeNull()
  })
})

describe('useProfiles — import de sauvegarde', () => {
  it('remplace toutes les données en mode replace', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Local', '🐻')
    })

    let outcome
    act(() => {
      outcome = result.current.importData(backupWith([{ id: 'ext', name: 'Importé' }]), 'replace')
    })

    expect(outcome).toMatchObject({ ok: true })
    expect(result.current.profiles.map((p) => p.name)).toEqual(['Importé'])
  })

  it('ajoute les profils absents sans écraser les existants en mode merge', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Maison', '🐻')
    })

    act(() => {
      result.current.importData(backupWith([{ id: 'ecole', name: 'École' }]), 'merge')
    })

    expect(result.current.profiles.map((p) => p.name)).toEqual(['Maison', 'École'])
  })

  it('ignore un profil déjà présent plutôt que de le dupliquer', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    const existing = result.current.activeProfile!

    let outcome
    act(() => {
      outcome = result.current.importData(
        backupWith([{ id: existing.id, name: 'Lina (copie)' }]),
        'merge',
      )
    })

    expect(outcome).toMatchObject({ ok: false })
    expect(result.current.profiles).toHaveLength(1)
    expect(result.current.profiles[0].name).toBe('Lina')
  })

  it('refuse un import qui ferait dépasser le nombre maximum de profils', () => {
    const { result } = renderHook(() => useProfiles())
    for (let i = 0; i < MAX_PROFILES; i++) {
      act(() => {
        result.current.createProfile(`Profil ${i}`, '🐻')
      })
    }

    let outcome
    act(() => {
      outcome = result.current.importData(backupWith([{ id: 'trop', name: 'De trop' }]), 'merge')
    })

    expect(outcome).toMatchObject({ ok: false })
    expect(result.current.profiles).toHaveLength(MAX_PROFILES)
  })

  it('rejette un fichier invalide sans toucher aux données existantes', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })

    let outcome
    act(() => {
      outcome = result.current.importData('{"app":"autre"}', 'replace')
    })

    expect(outcome).toMatchObject({ ok: false })
    expect(result.current.profiles).toHaveLength(1)
  })
})

describe('useProfiles — favoris et masquage', () => {
  function withProfile() {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    return { result, id: result.current.activeProfile!.id }
  }

  it('ajoute puis retire un favori', () => {
    const { result, id } = withProfile()
    act(() => result.current.basculerFavori(id, 'besoins#0'))
    expect(result.current.activeProfile!.pageFavoris[0]).toBe('besoins#0')
    act(() => result.current.basculerFavori(id, 'besoins#0'))
    expect(result.current.activeProfile!.pageFavoris[0]).toBeNull()
  })

  it('ajoute les favoris dans l’ordre où ils sont choisis', () => {
    const { result, id } = withProfile()
    act(() => result.current.basculerFavori(id, 'besoins#3'))
    act(() => result.current.basculerFavori(id, 'besoins#0'))
    expect(result.current.activeProfile!.pageFavoris.slice(0, 2)).toEqual([
      'besoins#3',
      'besoins#0',
    ])
  })

  /**
   * La réserve ouverte depuis le lot favoris se referme ici : retirer un favori
   * laissait auparavant glisser d'un cran tous ceux qui suivaient.
   */
  it('laisse un trou à sa place quand un favori est retiré', () => {
    const { result, id } = withProfile()
    act(() => result.current.basculerFavori(id, 'besoins#0'))
    act(() => result.current.basculerFavori(id, 'besoins#1'))
    act(() => result.current.basculerFavori(id, 'besoins#3'))

    act(() => result.current.basculerFavori(id, 'besoins#1'))

    expect(result.current.activeProfile!.pageFavoris.slice(0, 3)).toEqual([
      'besoins#0',
      null,
      'besoins#3',
    ])
  })

  it('masque puis réaffiche une case', () => {
    const { result, id } = withProfile()
    act(() => result.current.basculerMasque(id, 'besoins#1'))
    expect(result.current.activeProfile!.slotsMasques).toEqual(['besoins#1'])
    act(() => result.current.basculerMasque(id, 'besoins#1'))
    expect(result.current.activeProfile!.slotsMasques).toEqual([])
  })

  it('pose un mot ajouté sur la première case libre de la page', () => {
    const { result, id } = withProfile()
    act(() => {
      result.current.ajouterMotPerso(id, 'Maman', 'data:image/webp;base64,AAAA', 'besoins')
    })
    const motId = result.current.activeProfile!.lexiquePerso[0].id
    // Les cinq premières cases de « besoins » sont occupées par le tableau.
    expect(result.current.activeProfile!.placements['besoins#5']).toBe(motId)
  })

  it('purge favori, masquage et placement quand le mot ajouté est supprimé', () => {
    const { result, id } = withProfile()
    act(() => {
      result.current.ajouterMotPerso(id, 'Maman', 'data:image/webp;base64,AAAA', 'besoins')
    })
    const motId = result.current.activeProfile!.lexiquePerso[0].id
    act(() => result.current.basculerFavori(id, 'besoins#5'))
    act(() => result.current.basculerMasque(id, 'besoins#5'))

    act(() => result.current.retirerMotPerso(id, motId))

    // Sans ce nettoyage, une adresse fantôme resterait référencée et
    // reviendrait hanter un import ou une réutilisation de la case.
    expect(result.current.activeProfile!.pageFavoris).not.toContain('besoins#5')
    expect(result.current.activeProfile!.slotsMasques).toEqual([])
    expect(result.current.activeProfile!.lexiquePerso).toEqual([])
    expect(result.current.activeProfile!.placements).toEqual({})
  })
})

describe('useProfiles — jauge d’occupation', () => {
  it('augmente quand un pictogramme personnalisé est ajouté', () => {
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    const before = result.current.usedBytes

    act(() => {
      result.current.ajouterMotPerso(
        result.current.activeProfile!.id,
        'chien',
        'data:image/webp;base64,' + 'A'.repeat(500),
        'besoins',
      )
    })

    expect(result.current.usedBytes).toBeGreaterThan(before + 500)
  })
})

describe('useProfiles — historique', () => {
  it('n’enregistre pas deux fois la même phrase prononcée coup sur coup', () => {
    // La phrase restant affichée après lecture, « Parler » est souvent appuyé
    // plusieurs fois de suite : sans garde, l'historique se remplirait de
    // doublons qui chasseraient les phrases précédentes.
    const { result } = renderHook(() => useProfiles())
    act(() => {
      result.current.createProfile('Lina', '🦊')
    })
    const id = result.current.profiles[0].id

    act(() => result.current.addToHistory(id, ['moi', 'vouloir', 'manger']))
    act(() => result.current.addToHistory(id, ['moi', 'vouloir', 'manger']))
    expect(result.current.profiles[0].history).toHaveLength(1)

    act(() => result.current.addToHistory(id, ['moi', 'vouloir', 'boire']))
    expect(result.current.profiles[0].history).toHaveLength(2)

    // Une phrase déjà dite plus tôt reste enregistrable : seule la répétition
    // immédiate est écartée.
    act(() => result.current.addToHistory(id, ['moi', 'vouloir', 'manger']))
    expect(result.current.profiles[0].history).toHaveLength(3)
  })
})
