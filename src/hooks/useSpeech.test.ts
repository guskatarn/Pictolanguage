import { describe, it, expect } from 'vitest'
import { selectVoice } from './useSpeech'

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
