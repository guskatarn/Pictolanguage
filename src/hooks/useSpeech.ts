import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Choisit la voix française à utiliser, en privilégiant une voix **locale**.
 *
 * Deux raisons, toutes deux décisives pour ce public :
 * - **Confidentialité** — une voix « en ligne » fait transiter le texte de la
 *   phrase par les serveurs de l'éditeur du système. Les phrases composées par
 *   un enfant peuvent être intimes, et l'application promet que rien ne quitte
 *   l'appareil.
 * - **Fiabilité hors connexion** — une voix en ligne est muette sans réseau,
 *   ce qui contredit la priorité donnée au fonctionnement hors ligne.
 *
 * À qualité de disponibilité égale, les voix « enhanced » restent écartées :
 * elles supposent un téléchargement préalable et démarrent plus lentement, or
 * un retour immédiat compte davantage ici qu'un timbre plus naturel.
 */
export function selectVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const french = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'))
  if (french.length === 0) return null

  const isBasic = (v: SpeechSynthesisVoice) => !v.name.toLowerCase().includes('enhanced')

  return (
    french.find((v) => v.localService && isBasic(v)) ??
    french.find((v) => v.localService) ??
    french.find(isBasic) ??
    french[0]
  )
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  /**
   * `getVoices()` renvoie souvent une liste vide au premier appel, la liste
   * étant peuplée de façon asynchrone. Sans cette écoute, la toute première
   * phrase était prononcée sans voix choisie — donc potentiellement par une
   * voix en ligne, exactement ce que `selectVoice` cherche à éviter.
   */
  useEffect(() => {
    if (!isSupported) return
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [isSupported])

  const speak = useCallback(
    (text: string, options?: { rate?: number; volume?: number }) => {
      if (!isSupported || !text.trim()) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = options?.rate ?? 1
      utterance.volume = options?.volume ?? 1
      utterance.pitch = 1

      const voices = voicesRef.current.length
        ? voicesRef.current
        : window.speechSynthesis.getVoices()
      const voice = selectVoice(voices)
      if (voice) utterance.voice = voice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported],
  )

  const cancel = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  return { speak, cancel, isSpeaking, isSupported }
}
