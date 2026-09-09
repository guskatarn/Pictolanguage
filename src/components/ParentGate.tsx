import { useMemo, useState } from 'react'

export const PIN_LENGTH = 4

/**
 * Clavier numérique, plutôt qu'un champ de saisie.
 *
 * Le clavier du système recouvrirait la moitié de l'écran d'une tablette et
 * varie d'un appareil à l'autre ; ici les touches sont grandes, fixes, et la
 * saisie reste possible même quand l'appareil est en mode « épinglage
 * d'application ». Chaque touche fait 56 px, au-delà des 44 px recommandés :
 * elle est actionnée par un adulte, souvent d'une main, l'enfant sur les
 * genoux.
 */
function PinKeypad({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (valeur: string) => void
  disabled?: boolean
}) {
  const touche = (chiffre: string) => {
    if (disabled || value.length >= PIN_LENGTH) return
    onChange(value + chiffre)
  }

  return (
    <div className="mx-auto grid w-full max-w-[15rem] grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => touche(c)}
          disabled={disabled}
          className="h-14 rounded-xl bg-gray-100 text-xl font-bold text-gray-700 active:scale-95 disabled:opacity-40"
        >
          {c}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange('')}
        disabled={disabled}
        className="h-14 rounded-xl bg-gray-50 text-xs font-bold text-gray-500 active:scale-95 disabled:opacity-40"
        aria-label="Tout effacer"
      >
        Effacer
      </button>
      <button
        key="0"
        type="button"
        onClick={() => touche('0')}
        disabled={disabled}
        className="h-14 rounded-xl bg-gray-100 text-xl font-bold text-gray-700 active:scale-95 disabled:opacity-40"
      >
        0
      </button>
      <button
        type="button"
        onClick={() => onChange(value.slice(0, -1))}
        disabled={disabled}
        className="h-14 rounded-xl bg-gray-50 text-xl text-gray-500 active:scale-95 disabled:opacity-40"
        aria-label="Corriger"
      >
        ⌫
      </button>
    </div>
  )
}

function Pastilles({ longueur }: { longueur: number }) {
  return (
    <div className="flex justify-center gap-3 py-4" aria-hidden="true">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <span
          key={i}
          className={`h-3.5 w-3.5 rounded-full ${i < longueur ? 'bg-violet-600' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

type Etape = 'saisie' | 'oubli' | 'nouveau'

interface Props {
  /** `verification` demande le code existant ; `creation` en installe un nouveau. */
  mode: 'verification' | 'creation'
  /** Code enregistré, requis en mode vérification. */
  codeAttendu?: string | null
  onSuccess: () => void
  onCancel: () => void
  /** Appelé quand un nouveau code est choisi (création, ou remise à zéro). */
  onPinChange?: (code: string) => void
}

/**
 * Barrière parentale : réglages, étoiles de favori et gestion des profils
 * passent derrière un code à quatre chiffres.
 *
 * **Ce n'est pas un dispositif de sécurité et ne prétend pas l'être.** Le code
 * est enregistré en clair à côté des profils : n'importe quel adulte ayant
 * l'appareil en main peut le lire. Il protège d'un enfant qui vise un
 * pictogramme et touche l'étoile à côté, ou qui ouvre les réglages et masque la
 * moitié de son vocabulaire — pas d'un tiers malveillant. Le chiffrer donnerait
 * l'illusion inverse pour un gain nul, l'application n'ayant ni compte ni
 * serveur.
 *
 * **Code oublié.** Sans échappatoire, un parent se retrouverait enfermé hors de
 * ses propres données — l'export vit lui aussi derrière le verrou. La sortie
 * est une question de calcul mental, le « portail parental » que Google Play
 * Families reconnaît : un enfant qui ne lit pas encore ne la franchit pas,
 * un adulte la passe en trois secondes, et personne ne perd son vocabulaire.
 */
export default function ParentGate({
  mode,
  codeAttendu,
  onSuccess,
  onCancel,
  onPinChange,
}: Props) {
  const [etape, setEtape] = useState<Etape>(mode === 'creation' ? 'nouveau' : 'saisie')
  const [saisie, setSaisie] = useState('')
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [reponseCalcul, setReponseCalcul] = useState('')

  // Tiré une seule fois : recalculer l'opération à chaque frappe empêcherait
  // d'y répondre.
  const calcul = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 7)
    const b = 3 + Math.floor(Math.random() * 7)
    return { a, b, produit: a * b }
  }, [])

  const changerSaisie = (valeur: string) => {
    setErreur(null)
    setSaisie(valeur)
    if (valeur.length !== PIN_LENGTH) return

    if (etape === 'saisie') {
      if (valeur === codeAttendu) {
        onSuccess()
      } else {
        setErreur('Code incorrect.')
        setSaisie('')
      }
      return
    }

    // Étape « nouveau » : une seule frappe ne suffit pas, un chiffre à côté
    // enfermerait le parent dehors dès la prochaine ouverture.
    if (confirmation === null) {
      setConfirmation(valeur)
      setSaisie('')
      return
    }
    if (valeur === confirmation) {
      onPinChange?.(valeur)
      onSuccess()
    } else {
      setErreur('Les deux codes ne correspondent pas.')
      setConfirmation(null)
      setSaisie('')
    }
  }

  const verifierCalcul = () => {
    if (Number(reponseCalcul) === calcul.produit) {
      setEtape('nouveau')
      setSaisie('')
      setConfirmation(null)
      setErreur(null)
    } else {
      setErreur('Ce n’est pas le bon résultat.')
      setReponseCalcul('')
    }
  }

  const titre =
    etape === 'oubli'
      ? 'Vous êtes bien un adulte ?'
      : etape === 'nouveau'
        ? confirmation === null
          ? 'Choisissez un code'
          : 'Retapez le même code'
        : 'Code parent'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="fade-in w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">🔒 {titre}</h2>
          <button
            onClick={onCancel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {etape === 'oubli' ? (
          <div className="space-y-3">
            <p className="text-sm leading-snug text-gray-500">
              Répondez à cette question pour choisir un nouveau code. Aucune donnée ne sera
              perdue.
            </p>
            <p className="text-center text-2xl font-black text-gray-800">
              {calcul.a} × {calcul.b} = ?
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={reponseCalcul}
              onChange={(e) => {
                setErreur(null)
                setReponseCalcul(e.target.value)
              }}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-center text-xl font-bold"
              aria-label="Résultat"
            />
            {erreur && (
              <p role="alert" className="text-center text-sm font-bold text-red-600">
                {erreur}
              </p>
            )}
            <button
              onClick={verifierCalcul}
              className="min-h-[44px] w-full rounded-xl bg-violet-600 py-3 font-bold text-white active:scale-95"
            >
              Valider
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm leading-snug text-gray-500">
              {etape === 'nouveau'
                ? 'Ce code protège les réglages et les favoris des fausses manœuvres de l’enfant.'
                : 'Les réglages et les favoris sont protégés.'}
            </p>
            <Pastilles longueur={saisie.length} />
            {erreur && (
              <p role="alert" className="pb-3 text-center text-sm font-bold text-red-600">
                {erreur}
              </p>
            )}
            <PinKeypad value={saisie} onChange={changerSaisie} />
            {etape === 'saisie' && (
              <button
                onClick={() => {
                  setEtape('oubli')
                  setErreur(null)
                  setSaisie('')
                }}
                className="mt-4 w-full py-2 text-sm font-bold text-violet-600 underline"
              >
                Code oublié ?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
