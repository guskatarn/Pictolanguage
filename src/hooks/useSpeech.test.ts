import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Capacitor } from '@capacitor/core'
import { selectVoice, useSpeech } from './useSpeech'

// Les méthodes du greffon sont servies par un proxy : `vi.spyOn` n'a rien à
// quoi s'accrocher, d'où le remplacement du module entier.
const { parleNatif, stopNatif } = vi.hoisted(() => ({
  parleNatif: vi.fn(),
  stopNatif: vi.fn(),
}))
vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: { speak: parleNatif, stop: stopNatif },
}))

function voice(
  name: string,
  lang: string,
  localService: boolean,
): SpeechSynthesisVoice {
  return { name, lang, localService, default: false, voiceURI: name } as SpeechSynthesisVoice
}

const FR_LOCALE = voice('Amélie', 'fr-FR', true)
const FR_EN_LIGNE = voice('Google français', 'fr-FR', false)
const FR_LOCALE_ENHANCED = voice('Thomas (Enhanced)', 'fr-FR', true)
const EN_LOCALE = voice('Daniel', 'en-GB', true)

describe('selectVoice', () => {
  it('préfère une voix locale à une voix en ligne', () => {
    // Le cœur du correctif : une voix en ligne enverrait la phrase de l'enfant
    // chez l'éditeur du système, et resterait muette sans réseau.
    expect(selectVoice([FR_EN_LIGNE, FR_LOCALE])).toBe(FR_LOCALE)
  })

  it('préfère une voix locale même quand la voix en ligne vient en premier', () => {
    expect(selectVoice([FR_EN_LIGNE, FR_LOCALE_ENHANCED])).toBe(FR_LOCALE_ENHANCED)
  })

  it('écarte les voix « enhanced » quand une autre voix locale existe', () => {
    expect(selectVoice([FR_LOCALE_ENHANCED, FR_LOCALE])).toBe(FR_LOCALE)
  })

  it('accepte une voix locale « enhanced » faute de mieux', () => {
    expect(selectVoice([FR_LOCALE_ENHANCED])).toBe(FR_LOCALE_ENHANCED)
  })

  it('se rabat sur une voix en ligne si aucune voix locale n’est installée', () => {
    expect(selectVoice([FR_EN_LIGNE])).toBe(FR_EN_LIGNE)
  })

  it('ignore les voix d’une autre langue', () => {
    expect(selectVoice([EN_LOCALE, FR_EN_LIGNE])).toBe(FR_EN_LIGNE)
  })

  it('accepte les variantes régionales du français', () => {
    const canadien = voice('Chantal', 'fr-CA', true)
    expect(selectVoice([EN_LOCALE, canadien])).toBe(canadien)
  })

  it('ne renvoie rien si aucune voix française n’est disponible', () => {
    expect(selectVoice([EN_LOCALE])).toBeNull()
  })

  it('ne renvoie rien quand la liste est vide', () => {
    // Cas réel au premier appel : `getVoices()` est peuplé de façon asynchrone.
    expect(selectVoice([])).toBeNull()
  })
})

describe('useSpeech — chemin natif', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('passe par le moteur du système quand l’application est empaquetée', async () => {
    // La WebView d'Android n'implémente pas l'API Web Speech : le chemin
    // navigateur y reste muet, sans la moindre erreur. Constaté sur appareil
    // le 2026-09-09, d'où ce test de non-régression.
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    parleNatif.mockResolvedValue(undefined)
    stopNatif.mockResolvedValue(undefined)
    const parleWeb = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak: parleWeb, cancel: vi.fn(), getVoices: () => [] })

    const { result } = renderHook(() => useSpeech())
    act(() => result.current.speak('moi vouloir manger', { rate: 1.2, volume: 0.8 }))
    await waitFor(() => expect(parleNatif).toHaveBeenCalled())

    expect(parleNatif).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'moi vouloir manger',
        lang: 'fr-FR',
        rate: 1.2,
        volume: 0.8,
      }),
    )
    expect(parleWeb).not.toHaveBeenCalled()
  })

  it('garde le chemin navigateur hors application empaquetée', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    parleNatif.mockResolvedValue(undefined)
    const parleWeb = vi.fn()
    vi.stubGlobal('speechSynthesis', {
      speak: parleWeb,
      cancel: vi.fn(),
      getVoices: () => [voice('Hortense', 'fr-FR', true)],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    // jsdom n'implémente pas non plus l'API Web Speech, dont la classe
    // d'énoncé : sans ce doublet, le chemin navigateur ne peut pas être testé.
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = ''
        rate = 1
        volume = 1
        pitch = 1
        voice: SpeechSynthesisVoice | null = null
        constructor(public text: string) {}
      },
    )

    const { result, unmount } = renderHook(() => useSpeech())
    act(() => result.current.speak('bonjour'))

    expect(parleWeb).toHaveBeenCalled()
    expect(parleNatif).not.toHaveBeenCalled()
    // Démonté ici, et non par le nettoyage global : celui-ci s'exécute après
    // le retrait des doublets, et l'effet de démontage retomberait sur un
    // `speechSynthesis` redevenu indéfini.
    unmount()
  })
})
