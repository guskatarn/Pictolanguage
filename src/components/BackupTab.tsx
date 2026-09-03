import { useRef, useState } from 'react'
import { ImportMode, ImportOutcome } from '../hooks/useProfiles'
import { STORAGE_BUDGET_BYTES } from '../utils/storage'

interface Props {
  usedBytes: number
  onExport: () => void
  onImport: (raw: string, mode: ImportMode) => ImportOutcome
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function BackupTab({ usedBytes, onExport, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<{ name: string; raw: string } | null>(null)
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null)

  const ratio = Math.min(1, usedBytes / STORAGE_BUDGET_BYTES)
  const nearlyFull = ratio > 0.8

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Le champ est remis à zéro pour que re-choisir le même fichier redéclenche
    // bien l'événement `change`.
    e.target.value = ''
    if (!file) return
    setOutcome(null)
    try {
      setPendingFile({ name: file.name, raw: await file.text() })
    } catch {
      setPendingFile(null)
      setOutcome({ ok: false, message: 'Impossible de lire ce fichier.' })
    }
  }

  const runImport = (mode: ImportMode) => {
    if (!pendingFile) return
    if (
      mode === 'replace' &&
      !window.confirm(
        'Remplacer TOUTES les données de cet appareil par le contenu de la sauvegarde ?\n\n' +
          'Les profils, pictogrammes et historiques actuels seront définitivement perdus.',
      )
    ) {
      return
    }
    const result = onImport(pendingFile.raw, mode)
    setOutcome(result)
    if (result.ok) setPendingFile(null)
  }

  return (
    <div className="space-y-5">
      {/* Occupation du stockage */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-bold text-gray-700">Espace utilisé</span>
          <span className={`text-xs font-bold ${nearlyFull ? 'text-red-600' : 'text-gray-500'}`}>
            {formatSize(usedBytes)} / ~{formatSize(STORAGE_BUDGET_BYTES)}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${nearlyFull ? 'bg-red-500' : 'bg-violet-500'}`}
            style={{ width: `${Math.max(2, ratio * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5 leading-snug">
          {nearlyFull
            ? "L'espace est presque saturé : exportez vos données, puis supprimez des pictogrammes personnalisés."
            : 'Les pictogrammes personnalisés sont ce qui occupe le plus de place.'}
        </p>
      </div>

      {/* Export */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-bold text-gray-700 mb-1">💾 Sauvegarder</p>
        <p className="text-xs text-gray-500 mb-2 leading-snug">
          Enregistre tous les profils, pictogrammes personnalisés et réglages dans un
          fichier. À conserver : sans lui, désinstaller l'application efface tout
          définitivement.
        </p>
        <button
          onClick={onExport}
          className="w-full bg-violet-600 text-white rounded-xl py-3 font-bold text-base active:scale-95 transition-transform"
        >
          Exporter mes données
        </button>
      </div>

      {/* Import */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-bold text-gray-700 mb-1">📂 Restaurer</p>
        <p className="text-xs text-gray-500 mb-2 leading-snug">
          Recharge un fichier de sauvegarde, sur cet appareil ou sur un autre.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-violet-300 text-violet-700 rounded-xl py-3 font-bold text-base active:scale-95 transition-transform"
        >
          Choisir un fichier…
        </button>

        {pendingFile && (
          <div className="mt-3 bg-violet-50 rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-600 break-all">
              Fichier : <span className="font-bold">{pendingFile.name}</span>
            </p>
            <button
              onClick={() => runImport('merge')}
              className="w-full bg-violet-600 text-white rounded-lg py-2.5 font-bold text-sm active:scale-95"
            >
              Ajouter les profils manquants
            </button>
            <button
              onClick={() => runImport('replace')}
              className="w-full bg-red-100 text-red-700 rounded-lg py-2.5 font-bold text-sm active:scale-95"
            >
              Remplacer toutes mes données
            </button>
            <button
              onClick={() => setPendingFile(null)}
              className="w-full text-gray-500 text-xs py-1"
            >
              Annuler
            </button>
          </div>
        )}

        {outcome && (
          <p
            role="status"
            className={`mt-3 text-xs font-bold rounded-lg p-2.5 leading-snug ${
              outcome.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {outcome.message}
          </p>
        )}
      </div>
    </div>
  )
}
