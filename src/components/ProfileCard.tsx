import { UserProfile } from '../types'

interface Props {
  profile: UserProfile
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function ProfileCard({ profile, onSelect, onEdit, onDelete }: Props) {
  return (
    <div className="flex flex-col items-center bg-white/90 rounded-3xl p-5 shadow-lg border-2 border-white/60 gap-3">
      <button
        onClick={onSelect}
        className="flex flex-col items-center gap-3 w-full active:scale-95 transition-transform"
        aria-label={`Choisir le profil ${profile.name}`}
      >
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner bg-violet-100">
          {profile.avatar}
        </div>
        <span className="text-xl font-black text-gray-800 text-center leading-tight">
          {profile.name}
        </span>
      </button>

      <div className="flex gap-2 w-full">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-bold active:scale-95 transition-transform"
          aria-label="Modifier"
        >
          ✏️ Modifier
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-50 text-red-500 rounded-xl py-2 text-sm font-bold active:scale-95 transition-transform"
          aria-label="Supprimer"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  )
}
