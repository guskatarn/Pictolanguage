import { useState, useCallback, useRef } from 'react'

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string, options?: { rate?: number; volume?: number }) => {
      if (!isSupported || !text.trim()) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = options?.rate ?? 1
      utterance.volume = options?.volume ?? 1
      utterance.pitch = 1

      const voices = window.speechSynthesis.getVoices()
      const frVoice = voices.find(
        (v) => v.lang.startsWith('fr') && !v.name.toLowerCase().includes('enhanced'),
      ) ?? voices.find((v) => v.lang.startsWith('fr')) ?? null
      if (frVoice) utterance.voice = frVoice

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
