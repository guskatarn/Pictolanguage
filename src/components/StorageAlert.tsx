interface Props {
  message: string
  onDismiss: () => void
}

/**
 * Alerte de stockage — le pendant visible de la correction du quota.
 *
 * Elle doit apparaître par-dessus n'importe quel écran, y compris le sélecteur
 * de profils : une écriture peut échouer avant même qu'un profil soit actif.
 */
export default function StorageAlert({ message, onDismiss }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 fade-in">
      <div
        role="alert"
        className="mx-auto max-w-md bg-red-600 text-white rounded-2xl shadow-2xl p-4"
      >
        <p className="font-bold text-sm mb-1">⚠️ Enregistrement impossible</p>
        <p className="text-xs leading-snug opacity-95">{message}</p>
        <button
          onClick={onDismiss}
          className="mt-3 w-full bg-white/20 rounded-xl py-2 font-bold text-sm active:scale-95"
        >
          J'ai compris
        </button>
      </div>
    </div>
  )
}
