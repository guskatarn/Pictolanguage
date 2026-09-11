import { useState, useCallback, useRef, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

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
 *
 * N'est utilisée que par le chemin navigateur : dans l'application empaquetée,
 * c'est le moteur du système qui choisit la voix (voir plus bas).
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

/**
 * Pourquoi la voix n'est pas sortie, en des termes sur lesquels l'adulte peut
 * agir : chaque cause renvoie à un geste différent dans les réglages.
 */
export type CauseEchecVoix = 'moteur' | 'langue' | 'lecture' | 'inconnue'

export interface EchecVoix {
  cause: CauseEchecVoix
  /** Le message d'origine, tel quel : c'est lui qui permet un diagnostic à distance. */
  detail: string
}

/**
 * Traduit un refus du greffon de synthèse vocale d'Android. Le greffon ne
 * distingue ses échecs que par leur message (voir `TextToSpeechPlugin.java`),
 * d'où la comparaison de textes.
 */
export function diagnostiquerEchecNatif(erreur: unknown): EchecVoix {
  const detail = erreur instanceof Error ? erreur.message : String(erreur)
  const code = (erreur as { code?: unknown } | null)?.code
  // Moteur absent, désactivé, ou pas encore démarré.
  if (code === 'UNAVAILABLE' || /not available|not yet initialized/i.test(detail)) {
    return { cause: 'moteur', detail }
  }
  if (/language is not supported/i.test(detail)) return { cause: 'langue', detail }
  if (/failed to read text/i.test(detail)) return { cause: 'lecture', detail }
  return { cause: 'inconnue', detail }
}

/**
 * Même traduction pour le chemin navigateur, à partir du code d'erreur de
 * l'API Web Speech. `null` quand ce n'est pas un échec : une phrase coupée par
 * la suivante lève `interrupted` ou `canceled`, et c'est voulu.
 */
export function diagnostiquerEchecWeb(code: string): EchecVoix | null {
  switch (code) {
    case 'interrupted':
    case 'canceled':
      return null
    case 'synthesis-unavailable':
      return { cause: 'moteur', detail: code }
    case 'language-unavailable':
    case 'voice-unavailable':
      return { cause: 'langue', detail: code }
    default:
      return { cause: 'lecture', detail: code }
  }
}

/**
 * Lecture à voix haute, par deux chemins distincts.
 *
 * **Dans l'application empaquetée**, la synthèse passe par le moteur de
 * synthèse vocale d'Android, via un greffon Capacitor. Ce n'est pas un
 * raffinement : la WebView d'Android **n'implémente pas** l'API Web Speech,
 * contrairement à Chrome. Le même code qui parle sur un poste de bureau et
 * dans le navigateur d'une tablette reste totalement muet une fois empaqueté,
 * sans erreur ni message — panne constatée sur appareil le 2026-09-09.
 *
 * **Dans un navigateur** (développement, version web installable), on garde
 * `window.speechSynthesis` et le choix de voix ci-dessus.
 *
 * Un échec est rendu dans `echec`, pour être montré à l'adulte : sans cela
 * l'application reste muette sans rien dire, et ni l'enfant ni l'adulte ne
 * peuvent savoir si c'est le volume, le moteur ou la langue qui manque.
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [echec, setEchec] = useState<EchecVoix | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const isNative = Capacitor.isNativePlatform()
  const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window
  const isSupported = isNative || hasWebSpeech

  /**
   * `getVoices()` renvoie souvent une liste vide au premier appel, la liste
   * étant peuplée de façon asynchrone. Sans cette écoute, la toute première
   * phrase était prononcée sans voix choisie — donc potentiellement par une
   * voix en ligne, exactement ce que `selectVoice` cherche à éviter.
   */
  useEffect(() => {
    if (isNative || !hasWebSpeech) return
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [isNative, hasWebSpeech])

  const speak = useCallback(
    (text: string, options?: { rate?: number; volume?: number }) => {
      if (!isSupported || !text.trim()) return

      if (isNative) {
        setIsSpeaking(true)
        // `stop()` d'abord : deux appuis rapprochés sur « Parler » feraient
        // sinon la queue, et l'enfant entendrait sa phrase deux fois.
        TextToSpeech.stop()
          .catch(() => {})
          .then(() =>
            TextToSpeech.speak({
              text,
              lang: 'fr-FR',
              rate: options?.rate ?? 1,
              volume: options?.volume ?? 1,
              pitch: 1,
            }),
          )
          // La promesse ne se résout qu'à la fin de l'énoncé : c'est elle qui
          // rend l'animation du bouton fidèle à ce qu'on entend. Une phrase
          // enfin dite retire l'alerte : l'adulte a réparé ce qui manquait.
          .then(() => setEchec(null))
          .catch((erreur) => {
            // Montré à l'adulte, et gardé aussi dans le journal du système
            // (`adb logcat`) pour un diagnostic sur appareil.
            console.error('[disavecmoi] synthèse vocale indisponible :', erreur)
            setEchec(diagnostiquerEchecNatif(erreur))
          })
          .finally(() => setIsSpeaking(false))
        return
      }

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
      utterance.onend = () => {
        setIsSpeaking(false)
        setEchec(null)
      }
      utterance.onerror = (evenement) => {
        setIsSpeaking(false)
        const diagnostic = diagnostiquerEchecWeb(evenement.error)
        if (diagnostic) setEchec(diagnostic)
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, isNative],
  )

  const cancel = useCallback(() => {
    if (!isSupported) return
    if (isNative) {
      TextToSpeech.stop().catch(() => {})
    } else {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [isSupported, isNative])

  const oublierEchec = useCallback(() => setEchec(null), [])

  return { speak, cancel, isSpeaking, isSupported, echec, oublierEchec }
}
