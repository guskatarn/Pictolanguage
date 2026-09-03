import { Category } from '../types'

interface Props {
  categories: Category[]
  activeId: string
  onSelect: (id: string) => void
}

export default function CategoryTabs({ categories, activeId, onSelect }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 py-2 shrink-0" style={{ scrollbarWidth: 'none' }}>
      {categories.map((cat) => {
        const isActive = cat.id === activeId
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="shrink-0 rounded-xl px-4 py-2 font-bold text-sm transition-all duration-150"
            style={{
              backgroundColor: isActive ? cat.tabColor : '#e5e7eb',
              color: isActive ? '#fff' : '#374151',
              boxShadow: isActive ? `0 3px 8px ${cat.tabColor}55` : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
            aria-selected={isActive}
            aria-label={cat.name}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
