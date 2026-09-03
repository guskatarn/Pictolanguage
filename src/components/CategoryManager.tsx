import { useState } from 'react'
import { Category, UserProfile } from '../types'
import { DEFAULT_PICTOGRAMS } from '../data/defaultPictograms'

interface Props {
  profile: UserProfile
  categories: Category[]
  onReorderCategories: (order: string[]) => void
  onToggleHide: (pictoId: number) => void
  onToggleHideCustom: (customId: string) => void
}

/**
 * Onglet « Catégories » : ordre des catégories et choix des pictogrammes
 * affichés.
 *
 * Masquer plutôt que supprimer répond à un besoin documenté du public visé —
 * alléger la charge visuelle en retirant ce que l'enfant n'utilise pas — tout
 * en restant réversible : rien n'est détruit, la case se recoche.
 */
export default function CategoryManager({
  profile,
  categories,
  onReorderCategories,
  onToggleHide,
  onToggleHideCustom,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const moveCategory = (idx: number, dir: -1 | 1) => {
    const order = [...profile.categoryOrder]
    const target = idx + dir
    if (target < 0 || target >= order.length) return
    ;[order[idx], order[target]] = [order[target], order[idx]]
    onReorderCategories(order)
  }

  const countHiddenIn = (categoryId: string) => {
    const defaults = DEFAULT_PICTOGRAMS.filter(
      (p) => p.categoryId === categoryId && profile.hidden.includes(p.id),
    ).length
    const customs = profile.customPictograms.filter(
      (c) => c.categoryId === categoryId && profile.hiddenCustom.includes(c.id),
    ).length
    return defaults + customs
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Réordonnez les catégories avec les flèches, ou décochez les pictogrammes à
        retirer de la grille de l'enfant.
      </p>

      {profile.categoryOrder.map((catId, idx) => {
        const cat = categories.find((c) => c.id === catId)
        if (!cat) return null

        const defaults = DEFAULT_PICTOGRAMS.filter((p) => p.categoryId === catId)
        const customs = profile.customPictograms.filter((c) => c.categoryId === catId)
        const hiddenCount = countHiddenIn(catId)
        const isOpen = expanded === catId

        return (
          <div key={catId} className="rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 p-3">
              <span
                className="w-3 h-10 rounded-full shrink-0"
                style={{ backgroundColor: cat.tabColor }}
              />
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-gray-800 truncate">{cat.name}</span>
                {hiddenCount > 0 && (
                  <span className="block text-xs text-gray-500">
                    {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              <button
                onClick={() => moveCategory(idx, -1)}
                disabled={idx === 0}
                className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center disabled:opacity-30"
                aria-label={`Monter ${cat.name}`}
              >
                ↑
              </button>
              <button
                onClick={() => moveCategory(idx, 1)}
                disabled={idx === profile.categoryOrder.length - 1}
                className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center disabled:opacity-30"
                aria-label={`Descendre ${cat.name}`}
              >
                ↓
              </button>
              <button
                onClick={() => setExpanded(isOpen ? null : catId)}
                className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold"
                aria-expanded={isOpen}
                aria-label={`Gérer les pictogrammes de ${cat.name}`}
              >
                {isOpen ? '▴' : '▾'}
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-gray-200 px-3 py-2 space-y-1">
                {defaults.map((p) => {
                  const visible = !profile.hidden.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 py-1 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => onToggleHide(p.id)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      <span className={visible ? '' : 'text-gray-400 line-through'}>{p.word}</span>
                    </label>
                  )
                })}

                {customs.map((c) => {
                  const visible = !profile.hiddenCustom.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 py-1 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => onToggleHideCustom(c.id)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      <span className={visible ? '' : 'text-gray-400 line-through'}>{c.word}</span>
                      <span className="text-[10px] font-bold text-violet-600">perso</span>
                    </label>
                  )
                })}

                {defaults.length === 0 && customs.length === 0 && (
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
