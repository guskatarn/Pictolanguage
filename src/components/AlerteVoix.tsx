import type { CauseEchecVoix, EchecVoix } from '../hooks/useSpeech'

interface Props {
  echec: EchecVoix
  onDismiss: () => void
}

/**
 * Ce que l'adulte peut faire, cause par cause. Le chemin exact des réglages
 * varie selon la marque de l'appareil : on nomme ce qu'il faut chercher
 * plutôt qu'un chemin qui serait faux une fois sur deux.
 */
const EXPLICATIONS: Record<CauseEchecVoix, string> = {
  moteur:
    "Aucun moteur de synthèse vocale ne répond. Dans les réglages de l'appareil, cherchez « Synthèse vocale » et choisissez un moteur, par exemple celui de Google.",
  langue:
    "La voix française n'est pas installée. Dans les réglages de l'appareil, cherchez « Synthèse vocale », puis installez le français pour le moteur choisi.",
  lecture:
    "Le moteur de synthèse vocale n'a pas pu lire la phrase. Réessayez ; si cela se reproduit, vérifiez la synthèse vocale dans les réglages de l'appareil.",
  inconnue:
    "La synthèse vocale a échoué. Vérifiez qu'un moteur et la voix française sont installés, dans les réglages de l'appareil (« Synthèse vocale »).",
}

/**
 * Alerte de voix — le pendant visible d'un échec de la synthèse vocale.
 *
 * Elle s'adresse à l'adulte : l'enfant n'entend rien et ne peut pas savoir
 * pourquoi. Le détail technique est affiché tel quel, pour qu'un parent puisse
 * le recopier à qui l'aide, sans câble ni journal système.
 */
export default function AlerteVoix({ echec, onDismiss }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 fade-in">
      <div
        role="alert"
        className="mx-auto max-w-md bg-red-600 text-white rounded-2xl shadow-2xl p-4"
      >
        <p className="font-bold text-sm mb-1">🔇 La voix ne répond pas</p>
        <p className="text-xs leading-snug opacity-95">{EXPLICATIONS[echec.cause]}</p>
        <p className="mt-2 text-xs opacity-80 break-words">
          Détail technique : <span className="font-mono">{echec.detail}</span>
        </p>
        <button
          onClick={onDismiss}
          className="mt-3 w-full min-h-[44px] bg-white/20 rounded-xl py-2 font-bold text-sm active:scale-95"
        >
          J'ai compris
        </button>
      </div>
    </div>
  )
}
