import { useState } from 'react'
import { Category, RefSlot, UserProfile } from '../types'
import { TABLEAU_TLA, trouverPage } from '../data/tableauTla'
import { motsDeLaPage } from '../utils/vocabulaire'

interface Props {
  profile: UserProfile
  categories: Category[]
  onReorderCategories: (order: string[]) => void
  onToggleHide: (ref: RefSlot) => void
}

/**
 * Onglet « Catégories » : ordre des pages et choix des cases affichées.
 *
 * Masquer plutôt que supprimer répond à un besoin documenté du public visé —
 * alléger la charge visuelle en retirant ce que l'enfant n'utilise pas — tout
 * en restant réversible : rien n'est détruit, la case se recoche.
 *
 * Le masquage porte désormais sur **une case**, pas sur un mot. Un même mot
 * occupe souvent plusieurs cases du tableau, et l'ancien masquage par
 * identifiant les emportait toutes d'un coup, sans que rien ne l'annonce.
 *
 * L'accueil est listé en tête pour qu'on puisse y masquer des cases, mais sans
 * flèches : il reste le premier onglet quoi qu'il arrive.
 */
export default function CategoryManager({
  profile,
  categories,
  onReorderCategories,
  onToggleHide,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const movePage = (idx: number, dir: -1 | 1) => {
    const order = [...profile.ordrePages]
    const target = idx + dir
    if (target < 0 || target >= order.length) return
    ;[order[idx], order[target]] = [order[target], order[idx]]
    onReorderCategories(order)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Réordonnez les pages avec les flèches, ou décochez les pictogrammes à retirer
        de la grille de l'enfant. Un pictogramme retiré laisse sa case vide : les
        autres gardent leur place, que l'enfant a appris à reconnaître.
      </p>

      {[TABLEAU_TLA.pageRacine, ...profile.ordrePages].map((pageId, rang) => {
        const page = trouverPage(pageId)
        const cat = categories.find((c) => c.id === pageId)
        if (!page) return null
        // Rang dans l'ordre réordonnable ; -1 pour l'accueil, qui n'y figure pas.
        const idx = rang - 1

        const poses = motsDeLaPage(page, profile)
        const hiddenCount = poses.filter((p) => profile.slotsMasques.includes(p.ref)).length
        const isOpen = expanded === pageId

        return (
          <div key={pageId} className="rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 p-3">
              <span
                className="w-3 h-10 rounded-full shrink-0"
                style={{ backgroundColor: cat?.tabColor ?? '#6B7280' }}
              />
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-gray-800 truncate">{page.titre}</span>
                {hiddenCount > 0 && (
                  <span className="block text-xs text-gray-500">
                    {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              {idx >= 0 && (
                <>
                  <button
                    onClick={() => movePage(idx, -1)}
                    disabled={idx === 0}
                    className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center disabled:opacity-30"
                    aria-label={`Monter ${page.titre}`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => movePage(idx, 1)}
                    disabled={idx === profile.ordrePages.length - 1}
                    className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center disabled:opacity-30"
                    aria-label={`Descendre ${page.titre}`}
                  >
                    ↓
                  </button>
                </>
              )}
              <button
                onClick={() => setExpanded(isOpen ? null : pageId)}
                className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold"
                aria-expanded={isOpen}
                aria-label={`Gérer les pictogrammes de ${page.titre}`}
              >
                {isOpen ? '▴' : '▾'}
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-gray-200 px-3 py-2 space-y-1">
                {poses.map(({ ref, mot }) => {
                  const visible = !profile.slotsMasques.includes(ref)
                  return (
                    <label
                      key={ref}
                      className="flex items-center gap-2 py-1 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => onToggleHide(ref)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      <span className={visible ? '' : 'text-gray-400 line-through'}>
                        {mot.entree.mot}
                      </span>
                      {mot.isCustom && (
                        <span className="text-[10px] font-bold text-violet-600">perso</span>
                      )}
                    </label>
                  )
                })}

                {poses.length === 0 && (
                  <p className="py-1 text-xs text-gray-400">Aucun pictogramme.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
