import { useState } from 'react'
import { PictogramItem, ProfileSettings } from '../types'
import PictogramCard from './PictogramCard'

interface Props {
  onSearch: (requete: string) => PictogramItem[]
  onSelect: (picto: PictogramItem) => void
  onClose: () => void
  /** Repris de la grille : un mot doit garder sa couleur jusque dans la recherche. */
  modeCouleur: ProfileSettings['modeCouleur']
}

/**
 * Retrouver un mot pendant la composition d'une phrase.
 *
 * Le besoin est celui de l'adulte qui accompagne : l'enfant veut dire un mot,
 * et personne ne se souvient s'il est rangé dans « Actions » ou dans
 * « Objets ». Fouiller sept onglets prend plus de temps que l'enfant n'en
 * accorde, et l'échange se perd. C'est un critère de sélection retenu par les
 * orthophonistes dans le comparatif CAAPABLES, et l'un des écarts relevés à
 * l'audit face aux outils de référence.
 *
 * La recherche ne porte que sur le vocabulaire déjà installé : elle ne remplace
 * pas l'ajout d'un pictogramme depuis la banque ARASAAC, qui reste dans les
 * réglages, derrière le code parent.
 */
export default function SearchPanel({ onSearch, onSelect, onClose, modeCouleur }: Props) {
  const [requete, setRequete] = useState('')
  const resultats = onSearch(requete)
  const chercheDejaQuelqueChose = requete.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="fade-in relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-violet-600 px-4 py-3 text-white">
          <h2 className="text-lg font-bold">🔍 Chercher un mot</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-bold"
            aria-label="Fermer la recherche"
          >
            ✕
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 p-3">
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="manger, content, maison…"
            aria-label="Mot à chercher"
            autoFocus
            className="min-h-[44px] w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-base focus:border-violet-400 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {!chercheDejaQuelqueChose ? (
            <p className="px-1 pt-6 text-center text-sm leading-snug text-gray-400">
              Tapez le début d'un mot pour le retrouver, quelle que soit sa catégorie.
            </p>
          ) : resultats.length === 0 ? (
            <p className="px-1 pt-6 text-center text-sm leading-snug text-gray-400">
              Aucun pictogramme ne correspond à « {requete.trim()} ».
              <br />
              Vous pouvez en ajouter un depuis les réglages.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {resultats.map((picto) => (
                <PictogramCard
                  key={picto.key}
                  picto={picto}
                  size="S"
              modeCouleur={modeCouleur}
                  onClick={() => {
                    onSelect(picto)
                    onClose()
                  }}
                  onToggleFavorite={() => {}}
                  // Aucune étoile ici : la recherche sert à composer, pas à
                  // réorganiser, et l'écran est déjà chargé de résultats.
                  showFavorite={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
