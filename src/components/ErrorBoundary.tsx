import { Component, ErrorInfo, ReactNode } from 'react'
import { loadData, downloadBackup } from '../utils/storage'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Filet de sécurité global.
 *
 * Sans lui, la moindre exception de rendu laisse un écran blanc — le pire cas
 * pour un enfant qui cherche à communiquer, et une impasse pour le parent.
 *
 * Deux choix guidés par le public visé :
 * - le message reste court et non technique, le détail étant relégué derrière
 *   un dépliant pour qui veut le lire ;
 * - la sauvegarde est proposée ici même. Un plantage reproductible enfermerait
 *   sinon des mois de vocabulaire personnalisé dans un `localStorage`
 *   inaccessible, l'écran des Paramètres n'étant plus atteignable.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Aucun service de suivi de plantages : l'application ne collecte rien.
    // La console reste le seul canal, suffisant pour un diagnostic assisté.
    console.error('[PictoLanguage] Erreur non rattrapée :', error, info.componentStack)
  }

  private handleExport = () => {
    try {
      downloadBackup(loadData())
    } catch (err) {
      console.error('[PictoLanguage] Sauvegarde impossible depuis l\'écran d\'erreur :', err)
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-violet-50 p-6 text-center overflow-y-auto">
        <span className="text-6xl" role="img" aria-label="Outils">
          🛠️
        </span>
        <h1 className="text-xl font-black text-gray-800">L'application a rencontré un souci</h1>
        <p className="max-w-sm text-sm text-gray-600 leading-snug">
          Rien n'est perdu : les profils et les pictogrammes restent enregistrés sur
          l'appareil. Vous pouvez réessayer, ou enregistrer une sauvegarde par précaution.
        </p>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            onClick={() => this.setState({ error: null })}
            className="w-full rounded-xl bg-violet-600 py-3 font-bold text-white active:scale-95 transition-transform"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl border-2 border-violet-300 py-3 font-bold text-violet-700 active:scale-95 transition-transform"
          >
            Recharger l'application
          </button>
          <button
            onClick={this.handleExport}
            className="w-full rounded-xl bg-white py-3 font-bold text-gray-600 border border-gray-200 active:scale-95 transition-transform"
          >
            💾 Enregistrer une sauvegarde
          </button>
        </div>

        <details className="max-w-sm text-left">
          <summary className="cursor-pointer text-xs font-bold text-gray-500">
            Détail technique
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-100 p-2 text-[11px] text-gray-600">
            {error.message}
          </pre>
        </details>
      </div>
    )
  }
}
