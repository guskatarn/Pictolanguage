import { useState } from 'react'
import { UserProfile } from '../types'
import ProfileCard from './ProfileCard'

const AVATARS = ['🐻', '🐼', '🦊', '🐸', '🦄', '🐬', '🌟', '🌈', '🎈', '🚀', '🍓', '🌺']

interface Props {
  profiles: UserProfile[]
  onSelect: (id: string) => void
  onCreate: (name: string, avatar: string) => void
  onEdit: (profile: UserProfile) => void
  onDelete: (id: string) => void
}

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; profile: UserProfile }
  | { type: 'deleteConfirm'; profileId: string; profileName: string }

export default function ProfileSelector({ profiles, onSelect, onCreate, onEdit, onDelete }: Props) {
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  const openCreate = () => {
    setName('')
    setAvatar(AVATARS[0])
    setModal({ type: 'create' })
  }

  const openEdit = (profile: UserProfile) => {
    setName(profile.name)
    setAvatar(profile.avatar)
    setModal({ type: 'edit', profile })
  }

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (modal.type === 'create') {
      onCreate(trimmed, avatar)
      setModal({ type: 'none' })
    } else if (modal.type === 'edit') {
      onEdit({ ...modal.profile, name: trimmed, avatar })
      setModal({ type: 'none' })
    }
  }

  const maxReached = profiles.length >= 6

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
    >
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6 shrink-0">
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-5xl mb-4 shadow-xl">
          🗣️
        </div>
        <h1 className="text-3xl font-black text-white">disavecmoi</h1>
        <p className="text-violet-200 text-base mt-1">Qui es-tu ?</p>
      </div>

      {/* Profiles grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onSelect={() => onSelect(p.id)}
              onEdit={() => openEdit(p)}
              onDelete={() => setModal({ type: 'deleteConfirm', profileId: p.id, profileName: p.name })}
            />
          ))}

          {!maxReached && (
            <button
              onClick={openCreate}
              className="flex flex-col items-center justify-center bg-white/20 rounded-3xl p-5 border-4 border-dashed border-white/40 text-white gap-2 active:scale-95 transition-transform min-h-44"
              aria-label="Nouveau profil"
            >
              <span className="text-5xl">➕</span>
              <span className="text-lg font-bold">Nouveau profil</span>
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(modal.type === 'create' || modal.type === 'edit') && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal({ type: 'none' })} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl fade-in">
            <h3 className="text-xl font-black text-gray-800 mb-5 text-center">
              {modal.type === 'create' ? '✨ Nouveau profil' : '✏️ Modifier le profil'}
            </h3>

            <div className="mb-4">
              <label className="text-sm font-bold text-gray-600 block mb-1.5">Prénom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Ex: Emma..."
                maxLength={20}
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm font-bold text-gray-600 block mb-2">Choisir un avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((em) => (
                  <button
                    key={em}
                    onClick={() => setAvatar(em)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${
                      avatar === em
                        ? 'border-violet-500 bg-violet-100 scale-110'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModal({ type: 'none' })}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-base disabled:opacity-50"
              >
                {modal.type === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal.type === 'deleteConfirm' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal({ type: 'none' })} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center fade-in">
            <span className="text-5xl block mb-3">⚠️</span>
            <h3 className="text-xl font-black text-gray-800 mb-2">Supprimer le profil ?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Le profil de <strong>{modal.profileName}</strong> sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModal({ type: 'none' })}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDelete(modal.profileId)
                  setModal({ type: 'none' })
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
